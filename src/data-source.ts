import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { CreateUsersAndProfiles1780916400000 } from './migrations/1780916400000-CreateUsersAndProfiles';
import { AddDoctorAvailabilityStatus1749500000000 } from './migrations/1749500000000-AddDoctorAvailabilityStatus';
import { DoctorProfileEntity } from './doctor/doctor-profile.entity';
import { PatientProfileEntity } from './patient/patient-profile.entity';
import { UserEntity } from './users/user.entity';

const databasePort = Number.parseInt(process.env.DB_PORT ?? '5432', 10);

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: databasePort,
  username: process.env.DB_USERNAME ?? 'postgres',
  password: process.env.DB_PASSWORD ?? 'postgres',
  database: process.env.DB_NAME ?? 'schedula',
  entities: [UserEntity, DoctorProfileEntity, PatientProfileEntity],
  migrations: [CreateUsersAndProfiles1780916400000, AddDoctorAvailabilityStatus1749500000000],
  synchronize: false,
});
