import { IsEnum, IsNotEmpty, IsString, Matches } from 'class-validator';
import { DayOfWeek } from '../recurring-availability.entity';

export class CreateRecurringAvailabilityDto {
  @IsEnum(DayOfWeek)
  @IsNotEmpty()
  dayOfWeek!: DayOfWeek;

  @IsString()
  @IsNotEmpty()
  @Matches(/^([0-1]\d|2[0-3]):([0-5]\d)$/, { message: 'startTime must be a valid time in HH:mm format' })
  startTime!: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^([0-1]\d|2[0-3]):([0-5]\d)$/, { message: 'endTime must be a valid time in HH:mm format' })
  endTime!: string;
}
