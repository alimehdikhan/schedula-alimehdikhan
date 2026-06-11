import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DoctorProfileEntity } from './doctor-profile.entity';
import { DoctorController, DoctorDiscoveryController } from './doctor.controller';
import { DoctorService } from './doctor.service';
import { RecurringAvailabilityEntity } from './recurring-availability.entity';
import { CustomAvailabilityEntity } from './custom-availability.entity';
import { AvailabilityController } from './availability.controller';
import { AvailabilityService } from './availability.service';

@Module({
  imports: [TypeOrmModule.forFeature([DoctorProfileEntity, RecurringAvailabilityEntity, CustomAvailabilityEntity])],
  controllers: [DoctorController, DoctorDiscoveryController, AvailabilityController],
  providers: [DoctorService, AvailabilityService],
})
export class DoctorModule {}
