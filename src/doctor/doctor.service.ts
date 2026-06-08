import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateDoctorProfileDto } from './dto/create-doctor-profile.dto';
import { UpdateDoctorProfileDto } from './dto/update-doctor-profile.dto';
import { DoctorProfileEntity } from './doctor-profile.entity';

@Injectable()
export class DoctorService {
  constructor(
    @InjectRepository(DoctorProfileEntity)
    private readonly doctorProfilesRepository: Repository<DoctorProfileEntity>,
  ) {}

  async createProfile(
    userId: number,
    dto: CreateDoctorProfileDto,
  ): Promise<DoctorProfileEntity> {
    const existingProfile = await this.doctorProfilesRepository.findOne({
      where: { userId },
    });

    if (existingProfile) {
      throw new ConflictException('Doctor profile already exists');
    }

    const profile = this.doctorProfilesRepository.create({ ...dto, userId });

    return this.doctorProfilesRepository.save(profile);
  }

  async getProfile(userId: number): Promise<DoctorProfileEntity> {
    const profile = await this.doctorProfilesRepository.findOne({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException('Doctor profile not found');
    }

    return profile;
  }

  async updateProfile(
    userId: number,
    dto: UpdateDoctorProfileDto,
  ): Promise<DoctorProfileEntity> {
    const profile = await this.getProfile(userId);
    const updatedProfile = this.doctorProfilesRepository.merge(profile, dto);

    return this.doctorProfilesRepository.save(updatedProfile);
  }
}
