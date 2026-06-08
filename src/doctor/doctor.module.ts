import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DoctorProfileEntity } from './doctor-profile.entity';
import { DoctorController } from './doctor.controller';
import { DoctorService } from './doctor.service';

@Module({
  imports: [TypeOrmModule.forFeature([DoctorProfileEntity])],
  controllers: [DoctorController],
  providers: [DoctorService],
})
export class DoctorModule {}
