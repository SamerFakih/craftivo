import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TaskStatus, TaskPriority } from '@prisma/client';
import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsEnum,
} from 'class-validator';

export class CreateTaskDto {
  @ApiProperty({
    description: 'Task title',
    example: 'Implement user authentication',
  })
  @IsString()
  title: string;

  @ApiPropertyOptional({
    description: 'Task description',
    example: 'Setup JWT authentication with Passport',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Project ID this task belongs to',
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  project_id?: number;

  @ApiPropertyOptional({
    description: 'User ID assigned to this task',
    example: 2,
  })
  @IsOptional()
  @IsNumber()
  assigned_to?: number;

  @ApiPropertyOptional({
    enum: TaskStatus,
    description: 'Task status',
    example: 'pending',
  })
  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @ApiPropertyOptional({
    enum: TaskPriority,
    description: 'Task priority',
    example: 'high',
  })
  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @ApiPropertyOptional({
    description: 'Task due date',
    example: '2025-09-15',
  })
  @IsOptional()
  @IsString()
  due_date?: string;

  @ApiPropertyOptional({
    description: 'Due time in HH:MM format',
    example: '14:30',
  })
  @IsOptional()
  @IsString()
  due_time?: string;

  @ApiPropertyOptional({
    description: 'Estimated hours to complete',
    example: 8.5,
  })
  @IsOptional()
  @IsNumber()
  estimated_hours?: number;

  @ApiPropertyOptional({
    description: 'Actual hours spent',
    example: 6.0,
  })
  @IsOptional()
  @IsNumber()
  actual_hours?: number;

  @ApiPropertyOptional({
    description: 'Whether task is completed',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  completed?: boolean;

  @ApiPropertyOptional({
    description: 'Send email reminder',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  email_reminder?: boolean;

  @ApiPropertyOptional({
    description: 'Notify client',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  client_notification?: boolean;

  @ApiPropertyOptional({
    description: 'Whether task is active',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
