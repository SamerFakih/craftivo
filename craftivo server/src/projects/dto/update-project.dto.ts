import { PartialType } from '@nestjs/swagger';
import { CreateProjectDto } from './create-project.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { BillingType, ProjectPriority, ProjectStatus } from '@prisma/client';
import {
  OptionalNumber,
  OptionalTrimmedString,
  OptionalLowercasedEnum,
} from '../../common/dto/transformers';

export class UpdateProjectDto extends PartialType(CreateProjectDto) {
  // Accept common camelCase aliases to be friendly to frontends
  @ApiPropertyOptional({ description: 'Client ID (alias)', example: 1 })
  @IsOptional()
  @IsNumber()
  @OptionalNumber()
  clientId?: number;

  @ApiPropertyOptional({
    description: 'Start date (alias)',
    example: '2025-09-16',
  })
  @IsOptional()
  @IsString()
  @OptionalTrimmedString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End date (alias)',
    example: '2025-09-30',
  })
  @IsOptional()
  @IsString()
  @OptionalTrimmedString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Spent amount (alias)', example: 1000 })
  @IsOptional()
  @IsNumber()
  @OptionalNumber()
  spentAmount?: number;

  @ApiPropertyOptional({ description: 'Hourly rate (alias)', example: 75 })
  @IsOptional()
  @IsNumber()
  @OptionalNumber()
  hourlyRate?: number;

  @ApiPropertyOptional({
    description: 'Billing type (alias)',
    enum: BillingType,
    example: 'hourly',
  })
  @IsOptional()
  @IsEnum(BillingType)
  @OptionalLowercasedEnum()
  billingType?: BillingType;

  // Overrides from CreateProjectDto to make PATCH tolerant to casing and string numbers
  @ApiPropertyOptional({ description: 'Project status', enum: ProjectStatus })
  @IsOptional()
  @IsEnum(ProjectStatus)
  @OptionalLowercasedEnum()
  status?: ProjectStatus;

  @ApiPropertyOptional({
    description: 'Project priority',
    enum: ProjectPriority,
  })
  @IsOptional()
  @IsEnum(ProjectPriority)
  @OptionalLowercasedEnum()
  priority?: ProjectPriority;

  @ApiPropertyOptional({ description: 'Billing type', enum: BillingType })
  @IsOptional()
  @IsEnum(BillingType)
  @OptionalLowercasedEnum()
  billing_type?: BillingType;

  @ApiPropertyOptional({ description: 'Client ID', example: 1 })
  @IsOptional()
  @IsNumber()
  @OptionalNumber()
  client_id?: number;

  @ApiPropertyOptional({ description: 'Project budget', example: 10000.0 })
  @IsOptional()
  @IsNumber()
  @OptionalNumber()
  budget?: number;

  @ApiPropertyOptional({ description: 'Amount spent so far', example: 2500.5 })
  @IsOptional()
  @IsNumber()
  @OptionalNumber()
  spent_amount?: number;

  @ApiPropertyOptional({
    description: 'Project progress percentage (0-100)',
    example: 75,
  })
  @IsOptional()
  @IsNumber()
  @OptionalNumber()
  progress?: number;

  @ApiPropertyOptional({
    description: 'Hourly rate for this project',
    example: 85.0,
  })
  @IsOptional()
  @IsNumber()
  @OptionalNumber()
  hourly_rate?: number;
}
