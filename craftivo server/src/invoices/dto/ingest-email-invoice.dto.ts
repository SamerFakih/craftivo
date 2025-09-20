import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsDateString,
  IsEmail,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { CreateInvoiceItemDto } from './create-invoice.dto';

/**
 * DTO used by automation (n8n) to ingest an invoice parsed from an email.
 * Provides multiple ways to identify the client/project so the automation
 * doesn't have to supply both IDs.
 */
export class IngestEmailInvoiceDto {
  @ApiPropertyOptional({
    description: 'Explicit client ID if known',
    example: 12,
  })
  @IsOptional()
  @IsInt()
  client_id?: number;

  @ApiPropertyOptional({
    description: 'Client email (will lookup or create client)',
    example: 'client@example.com',
  })
  @IsOptional()
  @IsEmail()
  clientEmail?: string;

  @ApiPropertyOptional({
    description: 'Client name (used when creating a missing client)',
    example: 'Acme Corp',
  })
  @IsOptional()
  @IsString()
  clientName?: string;

  @ApiPropertyOptional({ description: 'Project ID if known', example: 5 })
  @IsOptional()
  @IsInt()
  project_id?: number;

  @ApiPropertyOptional({
    description: 'Project name (fallback to find existing project)',
    example: 'Website Revamp',
  })
  @IsOptional()
  @IsString()
  projectName?: string;

  @ApiPropertyOptional({
    description: 'Invoice number (auto-generated if omitted)',
    example: 'INV-2025-00042',
  })
  @IsOptional()
  @IsString()
  invoice_number?: string;

  @ApiProperty({ description: 'Issue date (ISO)', example: '2025-09-15' })
  @IsDateString()
  issue_date: string;

  @ApiProperty({ description: 'Due date (ISO)', example: '2025-09-30' })
  @IsDateString()
  due_date: string;

  @ApiPropertyOptional({ description: 'Currency code', example: 'USD' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ description: 'Payment terms', example: 'Net 15' })
  @IsOptional()
  @IsString()
  payment_terms?: string;

  @ApiPropertyOptional({ description: 'Free-form notes extracted from email' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Tax rate percent', example: 20 })
  @IsOptional()
  @IsNumber()
  tax_rate?: number;

  @ApiPropertyOptional({
    description: 'Discount amount absolute',
    example: 50,
  })
  @IsOptional()
  @IsNumber()
  discount_amount?: number;

  @ApiPropertyOptional({
    description: 'Parsed line items',
    type: [CreateInvoiceItemDto],
  })
  @IsOptional()
  @IsArray()
  items?: CreateInvoiceItemDto[];
}
