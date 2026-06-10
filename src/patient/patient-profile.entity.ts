import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserEntity } from '../users/user.entity';

export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  OTHER = 'OTHER',
}

@Entity('patient_profiles')
export class PatientProfileEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'user_id', unique: true })
  userId!: number;

  @OneToOne(() => UserEntity, (user) => user.patientProfile, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user!: UserEntity;

  @Column({ name: 'full_name', length: 120 })
  fullName!: string;

  @Column({ type: 'integer' })
  age!: number;

  @Column({ type: 'varchar', length: 20 })
  gender!: Gender;

  @Column({ name: 'contact_details', type: 'text' })
  contactDetails!: string;

  @Column({ name: 'health_information', type: 'text', nullable: true })
  healthInformation?: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
