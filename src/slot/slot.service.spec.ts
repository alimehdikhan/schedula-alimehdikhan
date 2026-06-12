import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { SlotService, TimeSlot } from './slot.service';
import { RecurringAvailabilityEntity, DayOfWeek } from '../doctor/recurring-availability.entity';
import { CustomAvailabilityEntity } from '../doctor/custom-availability.entity';
import { DoctorProfileEntity } from '../doctor/doctor-profile.entity';
import { AppointmentEntity, AppointmentStatus } from '../appointment/appointment.entity';

// Helper to format a local Date as YYYY-MM-DD (avoids toISOString UTC shift)
function formatLocalDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Helper to create a future date string (YYYY-MM-DD) for a given day-of-week offset
function getFutureDate(daysAhead: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return formatLocalDate(d);
}

function getTodayString(): string {
  return formatLocalDate(new Date());
}

function getDayOfWeek(dateString: string): DayOfWeek {
  const days: DayOfWeek[] = [
    DayOfWeek.SUN,
    DayOfWeek.MON,
    DayOfWeek.TUE,
    DayOfWeek.WED,
    DayOfWeek.THU,
    DayOfWeek.FRI,
    DayOfWeek.SAT,
  ];
  const d = new Date(dateString + 'T00:00:00');
  return days[d.getDay()];
}

describe('SlotService', () => {
  let service: SlotService;

  const mockProfileRepo = {
    findOne: jest.fn(),
  };

  const mockRecurringRepo = {
    find: jest.fn(),
  };

  const mockCustomRepo = {
    find: jest.fn(),
  };

  const mockAppointmentRepo = {
    find: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SlotService,
        {
          provide: getRepositoryToken(DoctorProfileEntity),
          useValue: mockProfileRepo,
        },
        {
          provide: getRepositoryToken(RecurringAvailabilityEntity),
          useValue: mockRecurringRepo,
        },
        {
          provide: getRepositoryToken(CustomAvailabilityEntity),
          useValue: mockCustomRepo,
        },
        {
          provide: getRepositoryToken(AppointmentEntity),
          useValue: mockAppointmentRepo,
        },
      ],
    }).compile();

    service = module.get<SlotService>(SlotService);

    // Reset all mocks
    jest.clearAllMocks();
  });

  // ─── Slot Generation from Recurring Availability ───────────────────────────

  describe('Recurring Availability → Slot Generation', () => {
    const futureDate = getFutureDate(7);
    const dayOfWeek = getDayOfWeek(futureDate);

    beforeEach(() => {
      mockProfileRepo.findOne.mockResolvedValue({ userId: 1, id: 1 });
      mockCustomRepo.find.mockResolvedValue([]); // no custom override
      mockAppointmentRepo.find.mockResolvedValue([]); // no bookings
    });

    it('should generate 30-min slots from a 1-hour window', async () => {
      mockRecurringRepo.find.mockResolvedValue([
        { doctorId: 1, dayOfWeek, startTime: '10:00:00', endTime: '11:00:00' },
      ]);

      const result = await service.getAvailableSlots(1, futureDate, 30, 'UTC');

      expect(result.slots).toEqual([
        { startTime: '10:00', endTime: '10:30' },
        { startTime: '10:30', endTime: '11:00' },
      ]);
      expect(result.slotDuration).toBe(30);
    });

    it('should generate 15-min slots from a 1-hour window', async () => {
      mockRecurringRepo.find.mockResolvedValue([
        { doctorId: 1, dayOfWeek, startTime: '10:00:00', endTime: '11:00:00' },
      ]);

      const result = await service.getAvailableSlots(1, futureDate, 15, 'UTC');

      expect(result.slots).toEqual([
        { startTime: '10:00', endTime: '10:15' },
        { startTime: '10:15', endTime: '10:30' },
        { startTime: '10:30', endTime: '10:45' },
        { startTime: '10:45', endTime: '11:00' },
      ]);
    });

    it('should generate 10-min slots from a 1-hour window', async () => {
      mockRecurringRepo.find.mockResolvedValue([
        { doctorId: 1, dayOfWeek, startTime: '10:00:00', endTime: '11:00:00' },
      ]);

      const result = await service.getAvailableSlots(1, futureDate, 10, 'UTC');

      expect(result.slots).toHaveLength(6);
      expect(result.slots[0]).toEqual({ startTime: '10:00', endTime: '10:10' });
      expect(result.slots[5]).toEqual({ startTime: '10:50', endTime: '11:00' });
    });

    it('should generate slots from multiple recurring windows', async () => {
      mockRecurringRepo.find.mockResolvedValue([
        { doctorId: 1, dayOfWeek, startTime: '09:00:00', endTime: '10:00:00' },
        { doctorId: 1, dayOfWeek, startTime: '14:00:00', endTime: '15:00:00' },
      ]);

      const result = await service.getAvailableSlots(1, futureDate, 30, 'UTC');

      expect(result.slots).toHaveLength(4);
      expect(result.slots[0].startTime).toBe('09:00');
      expect(result.slots[2].startTime).toBe('14:00');
    });

    it('should discard partial slots at end of window', async () => {
      mockRecurringRepo.find.mockResolvedValue([
        { doctorId: 1, dayOfWeek, startTime: '10:00:00', endTime: '10:40:00' },
      ]);

      // 30-min duration → only 1 full slot fits (10:00–10:30), not 10:30–11:00
      const result = await service.getAvailableSlots(1, futureDate, 30, 'UTC');

      expect(result.slots).toEqual([
        { startTime: '10:00', endTime: '10:30' },
      ]);
    });
  });

  // ─── Custom Override ──────────────────────────────────────────────────────

  describe('Custom Availability Override', () => {
    const futureDate = getFutureDate(7);

    beforeEach(() => {
      mockProfileRepo.findOne.mockResolvedValue({ userId: 1, id: 1 });
      mockAppointmentRepo.find.mockResolvedValue([]);
    });

    it('should use custom availability when it exists (overrides recurring)', async () => {
      mockCustomRepo.find.mockResolvedValue([
        { doctorId: 1, date: futureDate, startTime: '14:00:00', endTime: '16:00:00' },
      ]);

      // Recurring should NOT be queried at all
      mockRecurringRepo.find.mockResolvedValue([
        { doctorId: 1, dayOfWeek: DayOfWeek.MON, startTime: '09:00:00', endTime: '12:00:00' },
      ]);

      const result = await service.getAvailableSlots(1, futureDate, 30, 'UTC');

      // Should use custom: 14:00–16:00, not recurring: 09:00–12:00
      expect(result.slots[0].startTime).toBe('14:00');
      expect(result.slots).toHaveLength(4);
      // Recurring repo should NOT have been called
      expect(mockRecurringRepo.find).not.toHaveBeenCalled();
    });

    it('should fall back to recurring when no custom availability exists', async () => {
      const dayOfWeek = getDayOfWeek(futureDate);
      mockCustomRepo.find.mockResolvedValue([]);
      mockRecurringRepo.find.mockResolvedValue([
        { doctorId: 1, dayOfWeek, startTime: '09:00:00', endTime: '10:00:00' },
      ]);

      const result = await service.getAvailableSlots(1, futureDate, 30, 'UTC');

      expect(result.slots[0].startTime).toBe('09:00');
      expect(mockRecurringRepo.find).toHaveBeenCalled();
    });
  });

  // ─── Future Slots Only ────────────────────────────────────────────────────

  describe('Future Slots Only (Today)', () => {
    const today = getTodayString();

    beforeEach(() => {
      mockProfileRepo.findOne.mockResolvedValue({ userId: 1, id: 1 });
      mockCustomRepo.find.mockResolvedValue([]);
      mockAppointmentRepo.find.mockResolvedValue([]);
    });

    it('should filter out past slots when date is today', async () => {
      const dayOfWeek = getDayOfWeek(today);

      // Create availability window that spans past and future
      // Use 23:00–23:59 to ensure there's always a future slot in tests
      mockRecurringRepo.find.mockResolvedValue([
        { doctorId: 1, dayOfWeek, startTime: '00:00:00', endTime: '23:30:00' },
      ]);

      const result = await service.getAvailableSlots(1, today, 30, 'UTC');

      // Ensure the test actually has slots to evaluate
      expect(result.slots.length).toBeGreaterThan(0);

      // All returned slots should be in the future (relative to UTC)
      const timeString = new Intl.DateTimeFormat('en-US', {
        timeZone: 'UTC',
        hour: 'numeric',
        minute: 'numeric',
        hourCycle: 'h23',
      }).format(new Date());
      const [hours, minutes] = timeString.split(':').map(Number);
      const currentMinutes = hours * 60 + minutes;

      for (const slot of result.slots) {
        const [h, m] = slot.startTime.split(':').map(Number);
        expect(h * 60 + m).toBeGreaterThan(currentMinutes);
      }
    });

    it('should filter correctly for UTC+5:30 (Asia/Kolkata)', async () => {
      const dayOfWeek = getDayOfWeek(today);
      mockRecurringRepo.find.mockResolvedValue([
        { doctorId: 1, dayOfWeek, startTime: '00:00:00', endTime: '23:30:00' },
      ]);

      const result = await service.getAvailableSlots(1, today, 30, 'Asia/Kolkata');
      expect(result.slots.length).toBeGreaterThan(0);
      
      const timeString = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Kolkata',
        hour: 'numeric',
        minute: 'numeric',
        hourCycle: 'h23',
      }).format(new Date());
      const [hours, minutes] = timeString.split(':').map(Number);
      const tzMinutes = hours * 60 + minutes;

      for (const slot of result.slots) {
        const [h, m] = slot.startTime.split(':').map(Number);
        expect(h * 60 + m).toBeGreaterThan(tzMinutes);
      }
    });

    it('should filter correctly for UTC-8 (America/Los_Angeles)', async () => {
      const dayOfWeek = getDayOfWeek(today);
      mockRecurringRepo.find.mockResolvedValue([
        { doctorId: 1, dayOfWeek, startTime: '00:00:00', endTime: '23:30:00' },
      ]);

      const result = await service.getAvailableSlots(1, today, 30, 'America/Los_Angeles');
      expect(result.slots.length).toBeGreaterThan(0);
      
      const timeString = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/Los_Angeles',
        hour: 'numeric',
        minute: 'numeric',
        hourCycle: 'h23',
      }).format(new Date());
      const [hours, minutes] = timeString.split(':').map(Number);
      const tzMinutes = hours * 60 + minutes;

      for (const slot of result.slots) {
        const [h, m] = slot.startTime.split(':').map(Number);
        expect(h * 60 + m).toBeGreaterThan(tzMinutes);
      }
    });
  });

  // ─── Booked Slot Filtering ────────────────────────────────────────────────

  describe('Booked Slot Filtering', () => {
    const futureDate = getFutureDate(7);
    const dayOfWeek = getDayOfWeek(futureDate);

    beforeEach(() => {
      mockProfileRepo.findOne.mockResolvedValue({ userId: 1, id: 1 });
      mockCustomRepo.find.mockResolvedValue([]);
      mockRecurringRepo.find.mockResolvedValue([
        { doctorId: 1, dayOfWeek, startTime: '10:00:00', endTime: '11:00:00' },
      ]);
    });

    it('should exclude slots that overlap with booked appointments', async () => {
      mockAppointmentRepo.find.mockResolvedValue([
        {
          doctorId: 1,
          date: futureDate,
          startTime: '10:00:00',
          endTime: '10:30:00',
          status: AppointmentStatus.BOOKED,
        },
      ]);

      const result = await service.getAvailableSlots(1, futureDate, 30, 'UTC');

      // Only 10:30–11:00 should remain
      expect(result.slots).toEqual([
        { startTime: '10:30', endTime: '11:00' },
      ]);
    });

    it('should keep all slots when no appointments are booked', async () => {
      mockAppointmentRepo.find.mockResolvedValue([]);

      const result = await service.getAvailableSlots(1, futureDate, 30, 'UTC');

      expect(result.slots).toHaveLength(2);
    });

    it('should return empty slots when all are booked', async () => {
      mockAppointmentRepo.find.mockResolvedValue([
        {
          doctorId: 1,
          date: futureDate,
          startTime: '10:00:00',
          endTime: '10:30:00',
          status: AppointmentStatus.BOOKED,
        },
        {
          doctorId: 1,
          date: futureDate,
          startTime: '10:30:00',
          endTime: '11:00:00',
          status: AppointmentStatus.BOOKED,
        },
      ]);

      const result = await service.getAvailableSlots(1, futureDate, 30, 'UTC');

      expect(result.slots).toHaveLength(0);
      expect(result.message).toBe('No available slots for this date');
    });

    it('should NOT exclude slots for cancelled appointments', async () => {
      // The service queries with status: BOOKED, so cancelled appointments
      // are excluded at the DB level. Simulate the DB returning empty results
      // (because the only appointment is cancelled and doesn't match the query).
      mockAppointmentRepo.find.mockResolvedValue([]);

      const result = await service.getAvailableSlots(1, futureDate, 30, 'UTC');

      // All slots should remain available
      expect(result.slots).toHaveLength(2);
      expect(result.slots).toEqual([
        { startTime: '10:00', endTime: '10:30' },
        { startTime: '10:30', endTime: '11:00' },
      ]);

      // Verify the query was called with BOOKED status filter
      expect(mockAppointmentRepo.find).toHaveBeenCalledWith({
        where: {
          doctorId: 1,
          date: futureDate,
          status: AppointmentStatus.BOOKED,
        },
      });
    });
  });

  // ─── Edge Cases ───────────────────────────────────────────────────────────

  describe('Edge Cases', () => {
    it('should throw NotFoundException if doctor does not exist', async () => {
      mockProfileRepo.findOne.mockResolvedValue(null);

      await expect(
        service.getAvailableSlots(999, getFutureDate(7), 30),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException for invalid doctor ID', async () => {
      await expect(
        service.getAvailableSlots(-1, getFutureDate(7), 30),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for empty date', async () => {
      mockProfileRepo.findOne.mockResolvedValue({ userId: 1, id: 1 });

      await expect(
        service.getAvailableSlots(1, '', 30, 'UTC'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for invalid date format', async () => {
      mockProfileRepo.findOne.mockResolvedValue({ userId: 1, id: 1 });

      await expect(
        service.getAvailableSlots(1, 'not-a-date', 30, 'UTC'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for past date', async () => {
      mockProfileRepo.findOne.mockResolvedValue({ userId: 1, id: 1 });

      await expect(
        service.getAvailableSlots(1, '2020-01-01', 30, 'UTC'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for invalid slot duration', async () => {
      mockProfileRepo.findOne.mockResolvedValue({ userId: 1, id: 1 });

      await expect(
        service.getAvailableSlots(1, getFutureDate(7), 25),
      ).rejects.toThrow(BadRequestException);
    });

    it('should return empty slots with message when no availability exists', async () => {
      mockProfileRepo.findOne.mockResolvedValue({ userId: 1, id: 1 });
      mockCustomRepo.find.mockResolvedValue([]);
      mockRecurringRepo.find.mockResolvedValue([]);
      mockAppointmentRepo.find.mockResolvedValue([]);

      const result = await service.getAvailableSlots(1, getFutureDate(7), 30);

      expect(result.slots).toHaveLength(0);
      expect(result.message).toBe('No availability found for this date');
    });
  });

  // ─── Pure Slot Generation Logic ───────────────────────────────────────────

  describe('generateSlots (pure logic)', () => {
    it('should generate correct 15-min slots per the task example', () => {
      const windows: TimeSlot[] = [
        { startTime: '10:00', endTime: '11:00' },
      ];

      const slots = service.generateSlots(windows, 15);

      expect(slots).toEqual([
        { startTime: '10:00', endTime: '10:15' },
        { startTime: '10:15', endTime: '10:30' },
        { startTime: '10:30', endTime: '10:45' },
        { startTime: '10:45', endTime: '11:00' },
      ]);
    });

    it('should handle empty windows', () => {
      const slots = service.generateSlots([], 30);
      expect(slots).toEqual([]);
    });

    it('should handle window shorter than duration', () => {
      const windows: TimeSlot[] = [
        { startTime: '10:00', endTime: '10:05' },
      ];

      const slots = service.generateSlots(windows, 15);
      expect(slots).toEqual([]);
    });

    it('should handle window exactly equal to duration', () => {
      const windows: TimeSlot[] = [
        { startTime: '10:00', endTime: '10:30' },
      ];

      const slots = service.generateSlots(windows, 30);
      expect(slots).toEqual([
        { startTime: '10:00', endTime: '10:30' },
      ]);
    });

    it('should throw error for midnight-crossing window (23:00–01:00)', () => {
      const windows: TimeSlot[] = [
        { startTime: '23:00', endTime: '01:00' },
      ];

      expect(() => service.generateSlots(windows, 30)).toThrow(BadRequestException);
    });

    it('should throw error when start time equals end time', () => {
      const windows: TimeSlot[] = [
        { startTime: '10:00', endTime: '10:00' },
      ];

      expect(() => service.generateSlots(windows, 30)).toThrow(BadRequestException);
    });
  });
});
