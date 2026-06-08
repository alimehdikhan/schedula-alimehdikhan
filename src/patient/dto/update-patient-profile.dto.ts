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

export class UpdatePatientProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  fullName?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  age?: number;

  @IsOptional()
  @IsEnum(Gender, { message: 'gender must be MALE, FEMALE, or OTHER' })
  gender?: Gender;

  @IsOptional()
  @IsString()
  @MinLength(5)
  contactDetails?: string;

  @IsOptional()
  @IsString()
  healthInformation?: string;
}
