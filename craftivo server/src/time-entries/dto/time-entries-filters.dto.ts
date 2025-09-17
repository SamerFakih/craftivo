import {
  IsOptional,
  IsString,
  IsInt,
  IsBoolean,
  IsDateString,
  IsEnum,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { TimeEntryStatus } from '@prisma/client';
import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { CreateTimeEntriesDto } from './create-time-entries.dto';

export class TimeEntriesFiltersDto extends PartialType(CreateTimeEntriesDto) {
  @ApiPropertyOptional({ description: 'Filter by user ID' })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  user_id?: number;

  @ApiPropertyOptional({ description: 'Filter by project ID' })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  project_id?: number;

  @ApiPropertyOptional({ description: 'Filter by task ID' })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  task_id?: number;

  @ApiPropertyOptional({
    description: 'Filter by status',
    enum: TimeEntryStatus,
    example: TimeEntryStatus.logged,
  })
  @IsOptional()
  @IsEnum(TimeEntryStatus)
  status?: TimeEntryStatus;

  @ApiPropertyOptional({
    description: 'Filter by billable status',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    if (typeof value === 'boolean') return value;
    return undefined;
  })
  billable?: boolean;

  @ApiPropertyOptional({
    description: 'Filter by start date (ISO string)',
    example: '2024-01-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  start_date?: string;

  @ApiPropertyOptional({
    description: 'Filter by end date (ISO string)',
    example: '2024-12-31T23:59:59.999Z',
  })
  @IsOptional()
  @IsDateString()
  end_date?: string;

  @ApiPropertyOptional({ description: 'Filter by client ID' })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  client_id?: number;

  @ApiPropertyOptional({
    description: 'Page number for pagination',
    example: 1,
    minimum: 1,
  })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    example: 10,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'Sort field',
    example: 'start_time',
    enum: ['start_time', 'end_time', 'duration', 'created_at', 'updated_at'],
  })
  @IsOptional()
  @IsString()
  sort_by?: string = 'start_time';

  @ApiPropertyOptional({
    description: 'Sort order',
    example: 'desc',
    enum: ['asc', 'desc'],
  })
  @IsOptional()
  @IsString()
  sort_order?: 'asc' | 'desc' = 'desc';
}
