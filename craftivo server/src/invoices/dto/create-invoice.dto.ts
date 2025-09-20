import {
  IsString,
  IsInt,
  IsOptional,
  IsDateString,
  IsEnum,
  IsArray,
  IsNumber,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { InvoiceStatus } from '@prisma/client';

export class CreateInvoiceItemDto {
  @ApiProperty({
    description: 'The unique identifier for the item',
    example: 1,
  })
  @IsInt()
  id: number;

  @ApiProperty({
    description: 'The description of the item',
    example: 'Web design services',
  })
  @IsString()
  description: string;

  @ApiProperty({ description: 'The quantity of the item', example: 2 })
  @IsNumber({ maxDecimalPlaces: 2 })
  quantity: number;

  @ApiProperty({ description: 'The unit price of the item', example: 100 })
  @IsNumber({ maxDecimalPlaces: 2 })
  unit_price: number;

  @ApiPropertyOptional({
    description: 'The reference ID for the item',
    example: 1,
  })
  @IsOptional()
  @IsInt()
  reference_id?: number;
}

export class CreateInvoiceDto {
  @ApiProperty({
    description: 'The unique invoice number',
    example: 'INV-12345',
  })
  @IsString()
  invoice_number: string;

  @ApiPropertyOptional({ description: 'Client ID', example: 1 })
  @IsOptional()
  @IsInt()
  client_id?: number;

  @IsOptional()
  @IsNumber()
  discount_amount?: number;

  @ApiPropertyOptional({ description: 'Project ID', example: 1 })
  @IsOptional()
  @IsInt()
  project_id?: number;

  @ApiProperty({
    description: 'The issue date of the invoice',
    example: '2023-01-01',
  })
  @IsDateString()
  issue_date: string;

  @ApiProperty({
    description: 'The due date of the invoice',
    example: '2023-01-31',
  })
  @IsDateString()
  due_date: string;

  @ApiPropertyOptional({
    description: 'The status of the invoice',
    example: 'Paid',
  })
  @IsOptional()
  @IsEnum(InvoiceStatus)
  status?: InvoiceStatus;

  @ApiPropertyOptional({
    description: 'The tax rate applied to the invoice',
    example: 20,
  })
  @IsOptional()
  @IsNumber()
  tax_rate?: number;

  @ApiPropertyOptional({
    description: 'The currency of the invoice',
    example: 'USD',
  })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({
    description: 'The payment terms of the invoice',
    example: 'Net 30',
  })
  @IsOptional()
  @IsString()
  payment_terms?: string;

  @ApiPropertyOptional({
    description: 'Additional notes for the invoice',
    example: 'Thank you for your business!',
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({
    description: 'The line items of the invoice',
    type: [CreateInvoiceItemDto],
  })
  @IsArray()
  items: CreateInvoiceItemDto[];
}
