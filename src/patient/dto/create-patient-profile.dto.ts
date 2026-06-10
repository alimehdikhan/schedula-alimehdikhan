import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { Gender } from '../patient-profile.entity';

export class CreatePatientProfileDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  fullName!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  age!: number;

  @IsEnum(Gender, { message: 'gender must be MALE, FEMALE, or OTHER' })
  gender!: Gender;

  @IsString()
  @MinLength(5)
  contactDetails!: string;

  @IsOptional()
  @IsString()
  healthInformation?: string;
}
