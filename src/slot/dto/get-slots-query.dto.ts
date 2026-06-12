import { IsIn, IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';
import { Transform } from 'class-transformer';

export class GetSlotsQueryDto {
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'date must be in YYYY-MM-DD format' })
  @IsNotEmpty({ message: 'date query parameter is required' })
  date!: string;

  @IsString({ message: 'timezone must be a valid IANA timezone string' })
  @IsNotEmpty({ message: 'timezone query parameter is required' })
  timezone!: string;

  @IsOptional()
  @Transform(({ value }) => {
    const num = Number(value);
    return isNaN(num) ? value : num;
  })
  @IsIn([10, 15, 30], { message: 'slotDuration must be one of: 10, 15, 30' })
  slotDuration?: number = 30;
}
