import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PatientProfileEntity } from './patient-profile.entity';
import { PatientController } from './patient.controller';
import { PatientService } from './patient.service';

@Module({
  imports: [TypeOrmModule.forFeature([PatientProfileEntity])],
  controllers: [PatientController],
  providers: [PatientService],
})
export class PatientModule {}
