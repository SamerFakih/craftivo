import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { InvoiceStatus } from '@prisma/client';

export class UpdateStatusDto {
  @ApiProperty({
    enum: InvoiceStatus,
    description: 'New status for the invoice',
    example: 'paid',
  })
  @IsEnum(InvoiceStatus)
  status: InvoiceStatus;
}
