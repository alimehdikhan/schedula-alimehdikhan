import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { CreateDoctorProfileDto } from './dto/create-doctor-profile.dto';
import { UpdateDoctorProfileDto } from './dto/update-doctor-profile.dto';
import { QueryDoctorsDto } from './dto/query-doctors.dto';
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

  async findAll(query: QueryDoctorsDto): Promise<{
    data: DoctorProfileEntity[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    if (page < 1 || limit < 1) {
      throw new BadRequestException('Page and limit must be positive integers');
    }

    const where: Record<string, unknown> = {};

    if (query.specialization?.trim()) {
      where.specialization = ILike(`%${query.specialization.trim()}%`);
    }

    if (query.name?.trim()) {
      where.fullName = ILike(`%${query.name.trim()}%`);
    }

    if (query.available !== undefined) {
      where.isAvailable = query.available;
    }

    const [data, total] = await this.doctorProfilesRepository.findAndCount({
      where,
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: number): Promise<DoctorProfileEntity> {
    if (!id || isNaN(id) || id < 1) {
      throw new BadRequestException('Invalid doctor ID');
    }

    const doctor = await this.doctorProfilesRepository.findOne({
      where: { id },
    });

    if (!doctor) {
      throw new NotFoundException(`Doctor with ID ${id} not found`);
    }

    return doctor;
  }
}
