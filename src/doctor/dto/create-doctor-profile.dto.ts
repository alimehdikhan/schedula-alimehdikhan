import { Type } from 'class-transformer';
import {
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
  IsBoolean,
} from 'class-validator';

export class CreateDoctorProfileDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  fullName!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(120)
  specialization!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  experience!: number;

  @IsString()
  @MinLength(2)
  @MaxLength(160)
  qualification!: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(1)
  consultationFee!: number;

  @IsString()
  @MinLength(2)
  availability!: string;

  @IsString()
  @MinLength(2)
  profileDetails!: string;

  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;
}
