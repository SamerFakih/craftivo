import {
  IsOptional,
  IsString,
  IsInt,
  IsBoolean,
  IsDateString,
  IsNumber,
  IsEnum,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TimeEntryStatus } from '@prisma/client';
import { CreateTimeEntriesDto } from './create-time-entries.dto';
import { PartialType } from '@nestjs/swagger/dist/type-helpers/partial-type.helper';

export class UpdateTimeEntriesDto extends PartialType(CreateTimeEntriesDto) {
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  user_id?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  project_id?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  task_id?: number;

  @IsOptional()
  @IsDateString()
  start_time?: string;

  @IsOptional()
  @IsDateString()
  end_time?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  duration?: number; // Duration in seconds

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  billable?: boolean;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Type(() => Number)
  hourly_rate?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Type(() => Number)
  amount?: number;

  @IsOptional()
  @IsEnum(TimeEntryStatus)
  status?: TimeEntryStatus;
}
