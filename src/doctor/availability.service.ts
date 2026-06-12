import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RecurringAvailabilityEntity, DayOfWeek } from './recurring-availability.entity';
import { CustomAvailabilityEntity } from './custom-availability.entity';
import { DoctorProfileEntity } from './doctor-profile.entity';
import { CreateRecurringAvailabilityDto } from './dto/create-recurring-availability.dto';
import { UpdateRecurringAvailabilityDto } from './dto/update-recurring-availability.dto';
import { CreateCustomAvailabilityDto } from './dto/create-custom-availability.dto';

@Injectable()
export class AvailabilityService {
  constructor(
    @InjectRepository(RecurringAvailabilityEntity)
    private readonly recurringRepo: Repository<RecurringAvailabilityEntity>,
    @InjectRepository(CustomAvailabilityEntity)
    private readonly customRepo: Repository<CustomAvailabilityEntity>,
    @InjectRepository(DoctorProfileEntity)
    private readonly profileRepo: Repository<DoctorProfileEntity>,
  ) {}

  private async verifyDoctorExists(userId: number) {
    const profile = await this.profileRepo.findOne({ where: { userId } });
    if (!profile) {
      throw new NotFoundException('Doctor profile not found');
    }
  }

  private checkTimeRange(startTime: string, endTime: string) {
    if (startTime >= endTime) {
      throw new BadRequestException('startTime must be before endTime');
    }
  }

  private hasOverlap(slots: { startTime: string; endTime: string }[], newSlot: { startTime: string; endTime: string }, excludeId?: string) {
    return slots.some(slot => {
      // Exclude the slot being updated from overlap check
      if (excludeId && (slot as any).id === excludeId) return false;
      return newSlot.startTime < slot.endTime && newSlot.endTime > slot.startTime;
    });
  }

  // --- Recurring Availability ---

  async createRecurring(doctorId: number, dto: CreateRecurringAvailabilityDto) {
    await this.verifyDoctorExists(doctorId);
    this.checkTimeRange(dto.startTime, dto.endTime);

    const existingSlots = await this.recurringRepo.find({
      where: { doctorId, dayOfWeek: dto.dayOfWeek },
    });

    const isDuplicate = existingSlots.some(
      s => s.startTime === dto.startTime && s.endTime === dto.endTime
    );
    if (isDuplicate) {
      throw new ConflictException('Duplicate recurring availability slot');
    }

    if (this.hasOverlap(existingSlots, dto)) {
      throw new ConflictException('Overlapping time window for the same day');
    }

    const slot = this.recurringRepo.create({ ...dto, doctorId });
    return this.recurringRepo.save(slot);
  }

  async getRecurring(doctorId: number) {
    await this.verifyDoctorExists(doctorId);
    return this.recurringRepo.find({
      where: { doctorId },
      order: { dayOfWeek: 'ASC', startTime: 'ASC' },
    });
  }

  async updateRecurring(doctorId: number, id: string, dto: UpdateRecurringAvailabilityDto) {
    await this.verifyDoctorExists(doctorId);
    const slot = await this.recurringRepo.findOne({ where: { id } });

    if (!slot) {
      throw new NotFoundException('Recurring availability slot not found');
    }

    if (slot.doctorId !== doctorId) {
      throw new ForbiddenException('You can only modify your own slots');
    }

    const newStartTime = dto.startTime ?? slot.startTime;
    const newEndTime = dto.endTime ?? slot.endTime;
    const newDayOfWeek = dto.dayOfWeek ?? slot.dayOfWeek;

    this.checkTimeRange(newStartTime, newEndTime);

    const existingSlots = await this.recurringRepo.find({
      where: { doctorId, dayOfWeek: newDayOfWeek },
    });

    if (this.hasOverlap(existingSlots, { startTime: newStartTime, endTime: newEndTime }, id)) {
      throw new ConflictException('Overlapping time window for the same day');
    }

    Object.assign(slot, dto);
    return this.recurringRepo.save(slot);
  }

  async deleteRecurring(doctorId: number, id: string) {
    await this.verifyDoctorExists(doctorId);
    const slot = await this.recurringRepo.findOne({ where: { id } });

    if (!slot) {
      throw new NotFoundException('Recurring availability slot not found');
    }

    if (slot.doctorId !== doctorId) {
      throw new ForbiddenException('You can only modify your own slots');
    }

    await this.recurringRepo.remove(slot);
  }

  // --- Custom Availability ---

  async createCustom(doctorId: number, dto: CreateCustomAvailabilityDto) {
    await this.verifyDoctorExists(doctorId);
    this.checkTimeRange(dto.startTime, dto.endTime);

    const dateObj = new Date(dto.date);
    if (isNaN(dateObj.getTime())) {
      throw new BadRequestException('Invalid date format');
    }

    const requestedDate = new Date(dto.date + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (requestedDate < today) {
      throw new BadRequestException('Cannot set custom availability for past dates');
    }

    const existingSlots = await this.customRepo.find({
      where: { doctorId, date: dto.date },
    });

    const isDuplicate = existingSlots.some(
      s => s.startTime === dto.startTime && s.endTime === dto.endTime
    );
    if (isDuplicate) {
      throw new ConflictException('Duplicate custom availability slot');
    }

    if (this.hasOverlap(existingSlots, dto)) {
      throw new ConflictException('Overlapping time window for the same date');
    }

    const slot = this.customRepo.create({ ...dto, doctorId });
    return this.customRepo.save(slot);
  }

  // --- Resolve Date ---

  async resolveDate(doctorId: number, dateString: string) {
    await this.verifyDoctorExists(doctorId);
    if (!dateString) {
      throw new BadRequestException('Date query parameter is required');
    }

    const dateObj = new Date(dateString);
    if (isNaN(dateObj.getTime())) {
      throw new BadRequestException('Invalid date string');
    }

    const customSlots = await this.customRepo.find({
      where: { doctorId, date: dateString },
      order: { startTime: 'ASC' },
    });

    if (customSlots.length > 0) {
      return customSlots;
    }

    const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const dayOfWeek = days[dateObj.getUTCDay()] as DayOfWeek;

    const recurringSlots = await this.recurringRepo.find({
      where: { doctorId, dayOfWeek },
      order: { startTime: 'ASC' },
    });

    if (recurringSlots.length > 0) {
      return recurringSlots;
    }

    return { available: false };
  }
}
