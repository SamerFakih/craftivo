import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsEmail,
  IsOptional,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
} from 'class-validator';

export class CreateClientDto {
  @ApiProperty({ description: 'Client name', example: 'Client Name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Client email', example: 'client@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Client phone', example: '+1234567890' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ description: 'Client company', example: 'Client Company' })
  @IsString()
  @IsOptional()
  company?: string;

  @ApiProperty({
    description: 'Client address',
    example: '123 Main St, City, Country',
  })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiProperty({
    description: 'Client website',
    example: 'https://clientwebsite.com',
  })
  @IsString()
  @IsOptional()
  website?: string;

  @ApiProperty({
    description: 'Client notes',
    example: 'Some notes about the client',
  })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({ description: 'created by', example: 1 })
  @IsNumber()
  created_by: number;

  @ApiProperty({ description: 'active status', example: true })
  @IsBoolean()
  @IsOptional()
  active?: boolean;
}
