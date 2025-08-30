import {
  IsString,
  IsInt,
  IsOptional,
  IsDecimal,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  Min,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ContractStatus } from '@prisma/client';

export class CreateContractDto {
  @ApiProperty({
    description: 'Contract title',
    example: 'Website Development Contract',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @ApiPropertyOptional({
    description: 'Client ID',
    example: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  client_id?: number;

  @ApiPropertyOptional({
    description: 'Project ID',
    example: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  project_id?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  template_id?: number;

  @ApiProperty({
    description: 'Contract content/terms',
    example: 'This contract outlines the terms and conditions...',
  })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiPropertyOptional({
    enum: ContractStatus,
    description: 'Contract status',
    example: 'draft',
  })
  @IsOptional()
  @IsEnum(ContractStatus)
  status?: ContractStatus;

  @ApiPropertyOptional({
    description: 'Contract value',
    example: 5000.0,
  })
  @IsOptional()
  @IsDecimal()
  @Min(0)
  contract_value?: number;

  @ApiPropertyOptional({
    description: 'Currency code',
    example: 'USD',
  })
  @IsOptional()
  @IsString()
  @MaxLength(3)
  currency?: string;

  @ApiPropertyOptional({
    description: 'Contract start date',
    example: '2023-01-01',
  })
  @IsOptional()
  @IsDateString()
  start_date?: string;

  @ApiPropertyOptional({
    description: 'Contract end date',
    example: '2023-12-31',
  })
  @IsOptional()
  @IsDateString()
  end_date?: string;
}
