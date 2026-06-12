import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RecurringAvailabilityEntity } from '../doctor/recurring-availability.entity';
import { CustomAvailabilityEntity } from '../doctor/custom-availability.entity';
import { DoctorProfileEntity } from '../doctor/doctor-profile.entity';
import { AppointmentEntity } from '../appointment/appointment.entity';
import { SlotController } from './slot.controller';
import { SlotService } from './slot.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      RecurringAvailabilityEntity,
      CustomAvailabilityEntity,
      DoctorProfileEntity,
      AppointmentEntity,
    ]),
  ],
  controllers: [SlotController],
  providers: [SlotService],
})
export class SlotModule {}
