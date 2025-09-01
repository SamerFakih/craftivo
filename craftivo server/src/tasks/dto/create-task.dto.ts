import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TaskStatus, TaskPriority } from '@prisma/client';

export class CreateTaskDto {
  @ApiProperty({
    description: 'Task title',
    example: 'Implement user authentication',
  })
  title: string;

  @ApiPropertyOptional({
    description: 'Task description',
    example: 'Setup JWT authentication with Passport',
  })
  description?: string;

  @ApiPropertyOptional({
    description: 'Project ID this task belongs to',
    example: 1,
  })
  project_id?: number;

  @ApiPropertyOptional({
    description: 'User ID assigned to this task',
    example: 2,
  })
  assigned_to?: number;

  @ApiPropertyOptional({
    enum: TaskStatus,
    description: 'Task status',
    example: 'pending',
  })
  status?: TaskStatus;

  @ApiPropertyOptional({
    enum: TaskPriority,
    description: 'Task priority',
    example: 'high',
  })
  priority?: TaskPriority;

  @ApiPropertyOptional({
    description: 'Task due date',
    example: '2025-09-15',
  })
  due_date?: string;

  @ApiPropertyOptional({
    description: 'Due time in HH:MM format',
    example: '14:30',
  })
  due_time?: string;

  @ApiPropertyOptional({
    description: 'Estimated hours to complete',
    example: 8.5,
  })
  estimated_hours?: number;

  @ApiPropertyOptional({
    description: 'Actual hours spent',
    example: 6.0,
  })
  actual_hours?: number;

  @ApiPropertyOptional({
    description: 'Whether task is completed',
    example: false,
  })
  completed?: boolean;

  @ApiPropertyOptional({
    description: 'Send email reminder',
    example: true,
  })
  email_reminder?: boolean;

  @ApiPropertyOptional({
    description: 'Notify client',
    example: false,
  })
  client_notification?: boolean;

  @ApiPropertyOptional({
    description: 'Whether task is active',
    example: true,
  })
  active?: boolean;
}
