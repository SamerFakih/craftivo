import { ApiProperty } from '@nestjs/swagger';

export class CreateClientDto {
  @ApiProperty({ description: 'Client name', example: 'Client Name' })
  name: string;

  @ApiProperty({ description: 'Client email', example: 'client@example.com' })
  email: string;

  @ApiProperty({ description: 'Client phone', example: '+1234567890' })
  phone: string;

  @ApiProperty({ description: 'Client company', example: 'Client Company' })
  company: string;

  @ApiProperty({
    description: 'Client address',
    example: '123 Main St, City, Country',
  })
  address: string;

  @ApiProperty({
    description: 'Client website',
    example: 'https://clientwebsite.com',
  })
  website: string;

  @ApiProperty({
    description: 'Client notes',
    example: 'Some notes about the client',
  })
  notes: string;

  @ApiProperty({ description: 'created by', example: 'User ID' })
  created_by: number;

  @ApiProperty({ description: 'active status', example: true })
  active: boolean;
}
