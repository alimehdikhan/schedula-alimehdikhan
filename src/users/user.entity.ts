import {
  Column,
  CreateDateColumn,
  Entity,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { DoctorProfileEntity } from '../doctor/doctor-profile.entity';
import { PatientProfileEntity } from '../patient/patient-profile.entity';

export enum UserRole {
  DOCTOR = 'DOCTOR',
  PATIENT = 'PATIENT',
}

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  email!: string;

  @Column()
  password!: string;

  @Column({ type: 'varchar', length: 20 })
  role!: UserRole;

  @OneToOne(() => DoctorProfileEntity, (profile) => profile.user)
  doctorProfile?: DoctorProfileEntity;

  @OneToOne(() => PatientProfileEntity, (profile) => profile.user)
  patientProfile?: PatientProfileEntity;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}

export type PublicUser = Omit<UserEntity, 'password'>;
