import {
  IsString,
  IsOptional,
  IsNumber,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsArray,
  Min,
  Max,
  MaxLength,
  IsInt,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ProjectType {
  WEB_DEVELOPMENT = 'web-development',
  MOBILE_APP = 'mobile-app',
  DESIGN = 'design',
  CONTENT_WRITING = 'content-writing',
  CONSULTING = 'consulting',
  MARKETING = 'marketing',
  OTHER = 'other',
}

export enum PaymentStructure {
  MILESTONE = 'milestone',
  HOURLY = 'hourly',
  FIXED = 'fixed',
  MONTHLY = 'monthly',
}

/**
 * Simplified Contract Generation DTO
 */
export class GenerateContractDto {
  @ApiProperty({
    description: 'Project title',
    example: 'E-commerce Website Development',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  projectTitle: string;

  @ApiProperty({
    description: 'Type of project',
    enum: ProjectType,
    example: ProjectType.WEB_DEVELOPMENT,
  })
  @IsEnum(ProjectType)
  projectType: ProjectType;

  @ApiProperty({
    description: 'Project description and requirements',
    example: 'Build a modern e-commerce platform with payment integration.',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  projectDescription: string;

  @ApiProperty({
    description: 'Project budget',
    example: 15000,
    minimum: 100,
  })
  @IsNumber()
  @Min(100)
  budget: number;

  @ApiPropertyOptional({
    description: 'Currency code',
    example: 'USD',
    default: 'USD',
  })
  @IsOptional()
  @IsString()
  @MaxLength(3)
  currency?: string;

  @ApiProperty({
    description: 'Payment structure',
    enum: PaymentStructure,
    example: PaymentStructure.MILESTONE,
  })
  @IsEnum(PaymentStructure)
  paymentStructure: PaymentStructure;

  @ApiProperty({
    description: 'Project duration in weeks',
    example: 12,
    minimum: 1,
    maximum: 52,
  })
  @IsNumber()
  @Min(1)
  @Max(52)
  durationWeeks: number;

  @ApiProperty({
    description: 'Project start date',
    example: '2025-01-15',
  })
  @IsDateString()
  startDate: string;

  @ApiPropertyOptional({
    description: 'Key deliverables',
    type: [String],
    example: ['Responsive website', 'Payment integration', 'Admin dashboard'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(100, { each: true })
  deliverables?: string[];

  @ApiPropertyOptional({
    description: 'Existing client ID',
    example: 123,
  })
  @IsOptional()
  @IsNumber()
  clientId?: number;

  @ApiPropertyOptional({
    description: 'Client industry',
    example: 'healthcare',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  clientIndustry?: string;

  @ApiPropertyOptional({
    description: 'Client display name to personalize the contract',
    example: 'Acme Inc.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  clientName?: string;

  @ApiPropertyOptional({
    description: 'Freelancer or company display name to appear in the contract',
    example: 'John Doe',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  freelancerName?: string;
}

// Extends generation input with minimal persistence fields for agent flow
export class AgentGenerateAndSaveDto extends GenerateContractDto {
  @ApiProperty({
    description: 'Title for the new contract',
    example: 'E-commerce Website Development Agreement',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title!: string;

  @ApiPropertyOptional({
    description: 'Client ID to associate',
    example: 123,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  client_id?: number;

  @ApiPropertyOptional({
    description: 'Project ID to associate',
    example: 456,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  project_id?: number;

  @ApiPropertyOptional({
    description: 'Contract value if known',
    example: 15000,
    type: 'number',
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  contract_value?: number;

  @ApiPropertyOptional({
    description: 'Contract start date (ISO)',
    example: '2025-01-15',
  })
  @IsOptional()
  @IsDateString()
  start_date?: string;

  @ApiPropertyOptional({
    description: 'Contract end date (ISO)',
    example: '2025-04-30',
  })
  @IsOptional()
  @IsDateString()
  end_date?: string;
}
