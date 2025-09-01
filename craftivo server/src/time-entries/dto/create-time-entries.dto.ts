/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsInt,
  IsBoolean,
  IsDateString,
  IsDecimal,
  IsEnum,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TimeEntryStatus } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTimeEntriesDto {
  @ApiProperty({
    description: 'ID of the user associated with the time entry',
    example: 1,
  })
  @IsNotEmpty()
  @IsInt()
  @Type(() => Number)
  user_id: number;

  @ApiProperty({
    description: 'ID of the project associated with the time entry',
    example: 1,
  })
  @IsNotEmpty()
  @IsInt()
  @Type(() => Number)
  project_id: number;

  @ApiPropertyOptional({
    description: 'ID of the task associated with the time entry',
    example: 1,
  })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  task_id?: number;

  @ApiProperty({
    description: 'Start time of the time entry',
    example: '2024-01-01T00:00:00.000Z',
  })
  @IsNotEmpty()
  @IsDateString()
  start_time: string;

  @ApiPropertyOptional({
    description: 'End time of the time entry',
    example: '2024-01-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  end_time?: string;

  @ApiPropertyOptional({
    description: 'Duration of the time entry in seconds',
    example: 3600,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  duration?: number;

  @ApiPropertyOptional({
    description: 'Description of the time entry',
    example: 'Worked on project X',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Indicates whether the time entry is billable',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  billable?: boolean = true;

  @ApiPropertyOptional({
    description: 'Hourly rate for the time entry',
    example: 25.0,
  })
  @IsOptional()
  @IsDecimal({ decimal_digits: '2' })
  @Type(() => Number)
  hourly_rate?: number;

  @ApiPropertyOptional({
    description: 'Total amount for the time entry',
    example: 100.0,
  })
  @IsOptional()
  @IsDecimal({ decimal_digits: '2' })
  @Type(() => Number)
  amount?: number;

  @ApiPropertyOptional({
    description: 'Status of the time entry',
    example: TimeEntryStatus.logged,
  })
  @IsOptional()
  @IsEnum(TimeEntryStatus)
  status?: TimeEntryStatus = TimeEntryStatus.logged;
}
