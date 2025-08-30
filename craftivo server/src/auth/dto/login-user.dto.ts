import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, IsNotEmpty, MinLength } from 'class-validator';

export class LoginUserDto {
  @ApiProperty({ description: 'User email', example: 'john.doe@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'User password', example: 'strongpassword' })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;
}
