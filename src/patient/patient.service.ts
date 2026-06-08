import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreatePatientProfileDto } from './dto/create-patient-profile.dto';
import { UpdatePatientProfileDto } from './dto/update-patient-profile.dto';
import { PatientProfileEntity } from './patient-profile.entity';

@Injectable()
export class PatientService {
  constructor(
    @InjectRepository(PatientProfileEntity)
    private readonly patientProfilesRepository: Repository<PatientProfileEntity>,
  ) {}

  async createProfile(
    userId: number,
    dto: CreatePatientProfileDto,
  ): Promise<PatientProfileEntity> {
    const existingProfile = await this.patientProfilesRepository.findOne({
      where: { userId },
    });

    if (existingProfile) {
      throw new ConflictException('Patient profile already exists');
    }

    const profile = this.patientProfilesRepository.create({ ...dto, userId });

    return this.patientProfilesRepository.save(profile);
  }

  async getProfile(userId: number): Promise<PatientProfileEntity> {
    const profile = await this.patientProfilesRepository.findOne({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException('Patient profile not found');
    }

    return profile;
  }

  async updateProfile(
    userId: number,
    dto: UpdatePatientProfileDto,
  ): Promise<PatientProfileEntity> {
    const profile = await this.getProfile(userId);
    const updatedProfile = this.patientProfilesRepository.merge(profile, dto);

    return this.patientProfilesRepository.save(updatedProfile);
  }
}
