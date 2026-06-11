import { IsEnum, IsOptional, IsString, Matches } from 'class-validator';
import { DayOfWeek } from '../recurring-availability.entity';

export class UpdateRecurringAvailabilityDto {
  @IsEnum(DayOfWeek)
  @IsOptional()
  dayOfWeek?: DayOfWeek;

  @IsString()
  @IsOptional()
  @Matches(/^([0-1]\d|2[0-3]):([0-5]\d)$/, { message: 'startTime must be a valid time in HH:mm format' })
  startTime?: string;

  @IsString()
  @IsOptional()
  @Matches(/^([0-1]\d|2[0-3]):([0-5]\d)$/, { message: 'endTime must be a valid time in HH:mm format' })
  endTime?: string;
}
