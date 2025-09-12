import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsEnum,
} from 'class-validator';
import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { ProjectPriority, BillingType, ProjectStatus } from '@prisma/client';

export class CreateProjectDto {
  @ApiProperty({ description: 'Project name', example: 'E-commerce Website' })
  @IsString()
  name: string;

  @ApiPropertyOptional({
    description: 'Project description',
    example: 'A modern e-commerce platform',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Client ID', example: 1 })
  @IsNumber()
  @IsOptional()
  client_id?: number;

  @ApiProperty({
    enum: ProjectStatus,
    description: 'Project status',
    example: 'active',
  })
  @IsEnum(ProjectStatus)
  status: ProjectStatus;

  @ApiPropertyOptional({
    enum: ProjectPriority,
    description: 'Project priority',
    example: 'high',
  })
  @IsEnum(ProjectPriority)
  @IsOptional()
  priority?: ProjectPriority;

  @ApiPropertyOptional({
    description: 'Project start date',
    example: '2025-08-28',
  })
  @IsOptional()
  start_date?: string;

  @ApiPropertyOptional({
    description: 'Project end date',
    example: '2025-12-31',
  })
  @IsOptional()
  end_date?: string;

  @ApiPropertyOptional({ description: 'Project budget', example: 10000.0 })
  @IsNumber()
  @IsOptional()
  budget?: number;

  @ApiPropertyOptional({ description: 'Amount spent so far', example: 2500.5 })
  @IsNumber()
  @IsOptional()
  spent_amount?: number;

  @ApiPropertyOptional({
    description: 'Project progress percentage (0-100)',
    example: 75,
  })
  @IsNumber()
  @IsOptional()
  progress?: number;

  @ApiPropertyOptional({
    description: 'Hourly rate for this project',
    example: 85.0,
  })
  @IsNumber()
  @IsOptional()
  hourly_rate?: number;

  @ApiPropertyOptional({ description: 'Currency code', example: 'USD' })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiPropertyOptional({
    enum: BillingType,
    description: 'Billing type',
    example: 'hourly',
  })
  @IsEnum(BillingType)
  @IsOptional()
  billing_type?: BillingType;

  @ApiPropertyOptional({
    description: 'Whether project is active',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  active?: boolean;
}
