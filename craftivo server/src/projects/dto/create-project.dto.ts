import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProjectStatus, ProjectPriority, BillingType } from '@prisma/client';

export class CreateProjectDto {
  @ApiProperty({ description: 'Project name', example: 'E-commerce Website' })
  name: string;

  @ApiPropertyOptional({
    description: 'Project description',
    example: 'A modern e-commerce platform',
  })
  description?: string;

  @ApiProperty({ description: 'Client ID', example: 1 })
  client_id: number;

  @ApiProperty({ description: 'Owner User ID', example: 1 })
  owner_id: number;

  @ApiPropertyOptional({
    enum: ProjectStatus,
    description: 'Project status',
    example: 'active',
  })
  status?: ProjectStatus;

  @ApiPropertyOptional({
    enum: ProjectPriority,
    description: 'Project priority',
    example: 'high',
  })
  priority?: ProjectPriority;

  @ApiPropertyOptional({
    description: 'Project start date',
    example: '2025-08-28',
  })
  start_date?: Date;

  @ApiPropertyOptional({
    description: 'Project end date',
    example: '2025-12-31',
  })
  end_date?: Date;

  @ApiPropertyOptional({ description: 'Project budget', example: 10000.0 })
  budget?: number;

  @ApiPropertyOptional({ description: 'Amount spent so far', example: 2500.5 })
  spent_amount?: number;

  @ApiPropertyOptional({
    description: 'Project progress percentage (0-100)',
    example: 75,
  })
  progress?: number;

  @ApiPropertyOptional({
    description: 'Hourly rate for this project',
    example: 85.0,
  })
  hourly_rate?: number;

  @ApiPropertyOptional({ description: 'Currency code', example: 'USD' })
  currency?: string;

  @ApiPropertyOptional({
    enum: BillingType,
    description: 'Billing type',
    example: 'hourly',
  })
  billing_type?: BillingType;

  @ApiPropertyOptional({
    description: 'Whether project is active',
    example: true,
  })
  active?: boolean;
}
