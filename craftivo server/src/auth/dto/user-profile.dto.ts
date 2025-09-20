import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

export class UserProfileDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'john@example.com' })
  email: string;

  @ApiProperty({ example: 'John' })
  first_name: string;

  @ApiProperty({ example: 'Doe' })
  last_name: string;

  @ApiProperty({ enum: UserRole, example: 'freelancer' })
  role: UserRole;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.jpg' })
  profile_image?: string;

  @ApiPropertyOptional({ example: 'UTC' })
  timezone?: string;

  @ApiPropertyOptional({ example: 'John Design Studio' })
  business_name?: string;

  @ApiPropertyOptional({ example: 'https://johndesign.com' })
  website?: string;

  @ApiPropertyOptional({ example: '+1234567890' })
  phone?: string;

  @ApiPropertyOptional({ example: 'New York, USA' })
  location?: string;

  @ApiPropertyOptional({ example: '75.00' })
  hourly_rate?: string;

  @ApiProperty({ example: true })
  email_verified: boolean;

  @ApiProperty({ example: true })
  active: boolean;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  created_at: Date;
}
