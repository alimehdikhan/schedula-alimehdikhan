import { IsDateString, IsNotEmpty, IsString, Matches } from 'class-validator';

export class CreateCustomAvailabilityDto {
  @IsDateString()
  @IsNotEmpty()
  date!: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^([0-1]\d|2[0-3]):([0-5]\d)$/, { message: 'startTime must be a valid time in HH:mm format' })
  startTime!: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^([0-1]\d|2[0-3]):([0-5]\d)$/, { message: 'endTime must be a valid time in HH:mm format' })
  endTime!: string;
}
