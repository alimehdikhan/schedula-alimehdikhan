import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { CreateUsersAndProfiles1780916400000 } from './migrations/1780916400000-CreateUsersAndProfiles';
import { AddDoctorAvailabilityStatus1780916500000 } from './migrations/1780916500000-AddDoctorAvailabilityStatus';
import { DoctorProfileEntity } from './doctor/doctor-profile.entity';
import { PatientProfileEntity } from './patient/patient-profile.entity';
import { UserEntity } from './users/user.entity';

import { RecurringAvailabilityEntity } from './doctor/recurring-availability.entity';
import { CustomAvailabilityEntity } from './doctor/custom-availability.entity';
import { AppointmentEntity } from './appointment/appointment.entity';

import { CreateRecurringAvailability1781186675548 } from './migrations/1781186675548-CreateRecurringAvailability';
import { AddAvailabilityIndexes1781187097825 } from './migrations/1781187097825-AddAvailabilityIndexes';
import { CreateAppointments1781300000000 } from './migrations/1781300000000-CreateAppointments';
import { AddBookingConstraints1781400000000 } from './migrations/1781400000000-AddBookingConstraints';

const databasePort = Number.parseInt(process.env.DB_PORT ?? '5432', 10);
const isProduction = process.env.NODE_ENV === 'production';

export default new DataSource({
  type: 'postgres',
  ...(process.env.DATABASE_URL
    ? { url: process.env.DATABASE_URL }
    : {
        host: process.env.DB_HOST ?? 'localhost',
        port: databasePort,
        username: process.env.DB_USERNAME ?? 'postgres',
        password: process.env.DB_PASSWORD ?? 'postgres',
        database: process.env.DB_NAME ?? 'schedula',
      }),
  entities: [UserEntity, DoctorProfileEntity, PatientProfileEntity, RecurringAvailabilityEntity, CustomAvailabilityEntity, AppointmentEntity],
  migrations: [CreateUsersAndProfiles1780916400000, AddDoctorAvailabilityStatus1780916500000, CreateRecurringAvailability1781186675548, AddAvailabilityIndexes1781187097825, CreateAppointments1781300000000, AddBookingConstraints1781400000000],
  synchronize: false,
  ssl: isProduction ? { rejectUnauthorized: false } : false,
});
