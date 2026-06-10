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

@Entity('doctor_profiles')
export class DoctorProfileEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'user_id', unique: true })
  userId!: number;

  @OneToOne(() => UserEntity, (user) => user.doctorProfile, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user!: UserEntity;

  @Column({ name: 'full_name', length: 120 })
  fullName!: string;

  @Column({ length: 120 })
  specialization!: string;

  @Column({ type: 'integer' })
  experience!: number;

  @Column({ length: 160 })
  qualification!: string;

  @Column({
    name: 'consultation_fee',
    type: 'numeric',
    precision: 10,
    scale: 2,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => Number(value),
    },
  })
  consultationFee!: number;

  @Column({ type: 'text' })
  availability!: string;

  @Column({ name: 'profile_details', type: 'text' })
  profileDetails!: string;

  @Column({ name: 'is_available', default: true })
  isAvailable!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
