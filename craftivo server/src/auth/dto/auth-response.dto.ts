import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

export class AuthResponseDto {
  @ApiProperty({ example: 'User logged in successfully' })
  message: string;

  @ApiProperty({
    description: 'User information',
    example: {
      id: 1,
      email: 'john@example.com',
      first_name: 'John',
      last_name: 'Doe',
      role: 'freelancer',
    },
  })
  user: {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    role: UserRole;
  };

  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'JWT access token (for testing purposes)',
  })
  access_token?: string;
}
