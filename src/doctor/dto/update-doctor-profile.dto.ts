import { Type } from 'class-transformer';
import {
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class UpdateDoctorProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  fullName?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  specialization?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  experience?: number;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(160)
  qualification?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(1)
  consultationFee?: number;

  @IsOptional()
  @IsString()
  @MinLength(2)
  availability?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  profileDetails?: string;
}
