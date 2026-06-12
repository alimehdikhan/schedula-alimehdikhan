import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppointmentEntity, AppointmentStatus } from '../src/appointment/appointment.entity';
import { UserEntity, UserRole } from '../src/users/user.entity';
import { Repository } from 'typeorm';
import { AppModule } from '../src/app.module';

describe('Appointment Database Constraints', () => {
  let module: TestingModule;
  let userRepo: Repository<UserEntity>;
  let appointmentRepo: Repository<AppointmentEntity>;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    userRepo = module.get('UserEntityRepository');
    appointmentRepo = module.get('AppointmentEntityRepository');
  });

  afterAll(async () => {
    await module.close();
  });

  it('should reject duplicate bookings for the same doctor, date, and start time', async () => {
    // 1. Setup users
    const doctor = await userRepo.save({
      email: `doctor-${Date.now()}@test.com`,
      password: 'hash',
      role: UserRole.DOCTOR,
    });
    const patient1 = await userRepo.save({
      email: `patient1-${Date.now()}@test.com`,
      password: 'hash',
      role: UserRole.PATIENT,
    });
    const patient2 = await userRepo.save({
      email: `patient2-${Date.now()}@test.com`,
      password: 'hash',
      role: UserRole.PATIENT,
    });

    const date = '2026-06-20';
    const startTime = '10:00:00';
    const endTime = '10:30:00';

    // 2. Book first slot
    await appointmentRepo.save({
      doctorId: doctor.id,
      patientId: patient1.id,
      date,
      startTime,
      endTime,
      status: AppointmentStatus.BOOKED,
    });

    // 3. Attempt to double book same slot
    let error: any;
    try {
      await appointmentRepo.save({
        doctorId: doctor.id,
        patientId: patient2.id,
        date,
        startTime,
        endTime,
        status: AppointmentStatus.BOOKED,
      });
    } catch (err) {
      error = err;
    }

    // 4. Assert failure
    expect(error).toBeDefined();
    expect(error.code).toBe('23505'); // PostgreSQL unique_violation code
    expect(error.message).toContain('duplicate key value violates unique constraint "IDX_unique_booking"');

    // 5. Attempt to book same slot but as CANCELLED (should succeed due to partial index)
    const cancelledAppt = await appointmentRepo.save({
      doctorId: doctor.id,
      patientId: patient2.id,
      date,
      startTime,
      endTime,
      status: AppointmentStatus.CANCELLED,
    });
    expect(cancelledAppt.id).toBeDefined();
  });
});
