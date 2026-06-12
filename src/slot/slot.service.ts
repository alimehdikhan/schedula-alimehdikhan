import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RecurringAvailabilityEntity, DayOfWeek } from '../doctor/recurring-availability.entity';
import { CustomAvailabilityEntity } from '../doctor/custom-availability.entity';
import { DoctorProfileEntity } from '../doctor/doctor-profile.entity';
import { AppointmentEntity, AppointmentStatus } from '../appointment/appointment.entity';

export interface TimeSlot {
  startTime: string;
  endTime: string;
}

export interface SlotResponse {
  doctorId: number;
  date: string;
  slotDuration: number;
  slots: TimeSlot[];
  message?: string;
}

@Injectable()
export class SlotService {
  constructor(
    @InjectRepository(RecurringAvailabilityEntity)
    private readonly recurringRepo: Repository<RecurringAvailabilityEntity>,
    @InjectRepository(CustomAvailabilityEntity)
    private readonly customRepo: Repository<CustomAvailabilityEntity>,
    @InjectRepository(DoctorProfileEntity)
    private readonly profileRepo: Repository<DoctorProfileEntity>,
    @InjectRepository(AppointmentEntity)
    private readonly appointmentRepo: Repository<AppointmentEntity>,
  ) {}

  async getAvailableSlots(
    doctorId: number,
    dateString: string,
    slotDuration: number,
    timezone: string,
  ): Promise<SlotResponse> {
    // Validate doctorId
    if (!doctorId || isNaN(doctorId) || doctorId < 1) {
      throw new BadRequestException('Invalid doctor ID');
    }

    // Validate doctor exists
    const profile = await this.profileRepo.findOne({ where: { userId: doctorId } });
    if (!profile) {
      throw new NotFoundException(`Doctor with ID ${doctorId} not found`);
    }

    // Validate date
    if (!dateString) {
      throw new BadRequestException('date query parameter is required');
    }

    const dateObj = new Date(dateString + 'T00:00:00');
    if (isNaN(dateObj.getTime())) {
      throw new BadRequestException('Invalid date format. Use YYYY-MM-DD');
    }

    // Get current date in the requested timezone as YYYY-MM-DD
    const now = new Date();
    let tzNowString: string;
    try {
      tzNowString = new Intl.DateTimeFormat('en-CA', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(now);
    } catch (e) {
      throw new BadRequestException('Invalid timezone');
    }

    // Validate not a past date
    if (dateString < tzNowString) {
      throw new BadRequestException('Cannot fetch slots for past dates');
    }

    // Validate slot duration
    const validDurations = [10, 15, 30];
    if (!validDurations.includes(slotDuration)) {
      throw new BadRequestException('slotDuration must be one of: 10, 15, 30');
    }

    // Resolve availability: custom overrides recurring
    const availabilityWindows = await this.resolveAvailability(doctorId, dateString, dateObj);

    if (availabilityWindows.length === 0) {
      return {
        doctorId,
        date: dateString,
        slotDuration,
        slots: [],
        message: 'No availability found for this date',
      };
    }

    // Generate slots from availability windows
    let slots = this.generateSlots(availabilityWindows, slotDuration);

    // Filter past slots if date is today
    const isToday = dateString === tzNowString;
    if (isToday) {
      slots = this.filterPastSlots(slots, timezone);
    }

    // Filter booked slots
    slots = await this.filterBookedSlots(slots, doctorId, dateString);

    if (slots.length === 0) {
      return {
        doctorId,
        date: dateString,
        slotDuration,
        slots: [],
        message: 'No available slots for this date',
      };
    }

    return {
      doctorId,
      date: dateString,
      slotDuration,
      slots,
    };
  }

  /**
   * Resolve availability for a doctor on a given date.
   * Custom availability takes precedence over recurring availability.
   */
  private async resolveAvailability(
    doctorId: number,
    dateString: string,
    dateObj: Date,
  ): Promise<TimeSlot[]> {
    // Check for custom (override) availability first
    const customSlots = await this.customRepo.find({
      where: { doctorId, date: dateString },
      order: { startTime: 'ASC' },
    });

    if (customSlots.length > 0) {
      return customSlots.map((s) => ({
        startTime: this.normalizeTime(s.startTime),
        endTime: this.normalizeTime(s.endTime),
      }));
    }

    // Fall back to recurring availability
    const days: DayOfWeek[] = [
      DayOfWeek.SUN,
      DayOfWeek.MON,
      DayOfWeek.TUE,
      DayOfWeek.WED,
      DayOfWeek.THU,
      DayOfWeek.FRI,
      DayOfWeek.SAT,
    ];
    const dayOfWeek = days[dateObj.getDay()];

    const recurringSlots = await this.recurringRepo.find({
      where: { doctorId, dayOfWeek },
      order: { startTime: 'ASC' },
    });

    return recurringSlots.map((s) => ({
      startTime: this.normalizeTime(s.startTime),
      endTime: this.normalizeTime(s.endTime),
    }));
  }

  /**
   * Generate time slots from availability windows.
   * Only full-duration slots are generated (no partial slots at the end).
   */
  generateSlots(windows: TimeSlot[], durationMinutes: number): TimeSlot[] {
    const slots: TimeSlot[] = [];

    for (const window of windows) {
      const startMinutes = this.timeToMinutes(window.startTime);
      const endMinutes = this.timeToMinutes(window.endTime);

      if (startMinutes >= endMinutes) {
        throw new BadRequestException('Availability windows crossing midnight are not supported');
      }

      let current = startMinutes;
      while (current + durationMinutes <= endMinutes) {
        slots.push({
          startTime: this.minutesToTime(current),
          endTime: this.minutesToTime(current + durationMinutes),
        });
        current += durationMinutes;
      }
    }

    return slots;
  }

  /**
   * Filter out slots whose start time is in the past (for today's date).
   */
  private filterPastSlots(slots: TimeSlot[], timezone: string): TimeSlot[] {
    const now = new Date();
    const timeString = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: 'numeric',
      minute: 'numeric',
      hourCycle: 'h23',
    }).format(now);

    const [hours, minutes] = timeString.split(':').map(Number);
    const currentMinutes = hours * 60 + minutes;

    return slots.filter((slot) => {
      const slotStart = this.timeToMinutes(slot.startTime);
      return slotStart > currentMinutes;
    });
  }

  /**
   * Filter out slots that overlap with existing booked appointments.
   */
  private async filterBookedSlots(
    slots: TimeSlot[],
    doctorId: number,
    dateString: string,
  ): Promise<TimeSlot[]> {
    const bookedAppointments = await this.appointmentRepo.find({
      where: {
        doctorId,
        date: dateString,
        status: AppointmentStatus.BOOKED,
      },
    });

    if (bookedAppointments.length === 0) {
      return slots;
    }

    const bookedWindows = bookedAppointments.map((appt) => ({
      startTime: this.normalizeTime(appt.startTime),
      endTime: this.normalizeTime(appt.endTime),
    }));

    return slots.filter((slot) => {
      const slotStart = this.timeToMinutes(slot.startTime);
      const slotEnd = this.timeToMinutes(slot.endTime);

      // A slot is available if it doesn't overlap with any booked appointment
      return !bookedWindows.some((booked) => {
        const bookedStart = this.timeToMinutes(booked.startTime);
        const bookedEnd = this.timeToMinutes(booked.endTime);
        return slotStart < bookedEnd && slotEnd > bookedStart;
      });
    });
  }

  /**
   * Normalize time strings from database (could be "HH:mm:ss" or "HH:mm") to "HH:mm".
   */
  private normalizeTime(time: string): string {
    // Handle "HH:mm:ss" → "HH:mm"
    const parts = time.split(':');
    return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
  }

  /**
   * Convert "HH:mm" time string to total minutes since midnight.
   */
  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  /**
   * Convert total minutes since midnight to "HH:mm" time string.
   */
  private minutesToTime(totalMinutes: number): string {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }
}
