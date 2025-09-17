import {
  IsEmail,
  IsString,
  IsEnum,
  IsOptional,
  MinLength,
  MaxLength,
  IsPhoneNumber,
  IsUrl,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Transform } from 'class-transformer';

export class UpdateUserDto {
  @ApiProperty({
    example: 'john.doe@example.com',
    description: 'User email address',
  })
  @IsOptional()
  @IsEmail()
  @Transform(({ value }): string | undefined =>
    typeof value === 'string' ? value.toLowerCase().trim() : undefined,
  )
  email?: string;

  @ApiProperty({
    example: 'John',
    description: 'User first name',
    minLength: 2,
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  @Transform(({ value }): string | undefined =>
    typeof value === 'string' ? value.trim() : undefined,
  )
  first_name?: string;

  @ApiProperty({
    example: 'Doe',
    description: 'User last name',
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  @Transform(({ value }): string | undefined =>
    typeof value === 'string' ? value.trim() : undefined,
  )
  last_name?: string;

  @ApiProperty({
    example: 'password123',
    description: 'User password',
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  password_hash: string; // ✅ Add this field

  @ApiProperty({
    enum: UserRole,
    example: UserRole.freelancer,
    description: 'User role',
  })
  @IsEnum(UserRole)
  role: UserRole;

  @ApiPropertyOptional({
    example: '+1234567890',
    description: 'Phone number',
  })
  @IsOptional()
  @IsPhoneNumber()
  phone?: string;

  @ApiPropertyOptional({
    example: 'https://johndoe.com',
    description: 'Personal website',
  })
  @IsOptional()
  @IsUrl()
  website?: string;

  @ApiPropertyOptional({
    example: 'UTC',
    description: 'User timezone',
  })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiPropertyOptional({
    example: 'John Design Studio',
    description: 'Business name',
  })
  @IsOptional()
  @IsString()
  business_name?: string;
}
