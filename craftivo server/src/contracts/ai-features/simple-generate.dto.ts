import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

// This DTO mirrors the simple frontend form fields
export class SimpleGenerateDto {
  @ApiProperty({ description: 'Client or company name', example: 'Acme Inc.' })
  @IsString()
  @MaxLength(200)
  clientName!: string;

  @ApiPropertyOptional({
    description: 'Client email',
    example: 'client@example.com',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  clientEmail?: string;

  @ApiProperty({ description: 'Project title', example: 'E-commerce Website' })
  @IsString()
  @MaxLength(200)
  projectTitle!: string;

  @ApiPropertyOptional({
    description: 'Project description',
    example: 'Build a modern e-commerce platform.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({
    description: 'Start date (YYYY-MM-DD)',
    example: '2025-01-15',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End date (YYYY-MM-DD)',
    example: '2025-04-30',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Total contract amount', example: 15000 })
  @IsOptional()
  @IsNumber()
  totalAmount?: number;

  @ApiPropertyOptional({
    description: 'Payment schedule label',
    example: 'milestone',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  paymentSchedule?: string;

  @ApiPropertyOptional({
    description: 'Include Kill Fee clause',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  includeKillFee?: boolean;

  @ApiPropertyOptional({
    description: 'Include Rush Fee terms',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  includeRushFee?: boolean;

  @ApiPropertyOptional({
    description: 'IP ownership transfer to client',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  ipOwnership?: boolean;

  @ApiPropertyOptional({ description: 'Include NDA', example: true })
  @IsOptional()
  @IsBoolean()
  includeNda?: boolean;

  @ApiPropertyOptional({ description: 'Custom terms text' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  customTerms?: string;

  @ApiPropertyOptional({
    description: 'Existing client ID to associate',
    example: 42,
  })
  @IsOptional()
  @IsNumber()
  clientId?: number;

  @ApiPropertyOptional({
    description: 'Existing project ID to associate (client will be inferred)',
    example: 101,
  })
  @IsOptional()
  @IsNumber()
  projectId?: number;
}
