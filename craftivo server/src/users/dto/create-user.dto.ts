import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

export class CreateUserDto {
  @ApiProperty({ description: 'User email', example: 'john.doe@example.com' })
  email: string;

  @ApiProperty({ description: 'User password', example: 'strongpassword' })
  password_hash: string;

  @ApiProperty({ description: 'User first name', example: 'John' })
  first_name: string;

  @ApiProperty({ description: 'User last name', example: 'Doe' })
  last_name: string;

  @ApiPropertyOptional({
    description: 'User profile picture URL',
    example: 'https://example.com/profile.jpg',
  })
  profile_image?: string;

  @ApiPropertyOptional({
    enum: UserRole,
    description: 'User role',
    example: 'freelancer',
  })
  role?: UserRole;

  @ApiPropertyOptional({ description: 'User timezone', example: 'UTC' })
  timezone?: string;

  @ApiPropertyOptional({
    description: 'User email signature',
    example: 'Best regards, John Doe',
  })
  email_signature?: string;

  @ApiPropertyOptional({ description: 'User hourly rate', example: 85.0 })
  hourly_rate?: number;

  @ApiPropertyOptional({
    description: 'User business name',
    example: 'John Doe Inc.',
  })
  business_name?: string;

  @ApiPropertyOptional({
    description: 'User business address',
    example: '123 Main St',
  })
  business_address?: string;

  @ApiPropertyOptional({ description: 'User tax ID', example: 'TAX123456' })
  tax_id?: string;

  @ApiPropertyOptional({
    description: 'User website URL',
    example: 'https://johndoe.com',
  })
  website?: string;

  @ApiPropertyOptional({
    description: 'User phone number',
    example: '+1234567890',
  })
  phone?: string;

  @ApiPropertyOptional({
    description: 'User bio',
    example: 'Experienced software developer',
  })
  bio?: string;

  @ApiPropertyOptional({ description: 'Location', example: 'New York, USA' })
  location?: string;

  @ApiPropertyOptional({
    description: 'Email verification status',
    example: true,
  })
  email_verified?: boolean;

  @ApiPropertyOptional({ description: 'User account status', example: true })
  active?: boolean;
}
