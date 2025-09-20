import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export enum SignatureType {
  typed = 'typed',
  drawn = 'drawn',
}

export class SignRoleDto {
  @ApiProperty({ enum: ['client', 'freelancer'] })
  @IsEnum(['client', 'freelancer'])
  role!: 'client' | 'freelancer';

  @ApiProperty({ description: 'Signer display name' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ enum: SignatureType })
  @IsEnum(SignatureType)
  signatureType!: SignatureType;

  @ApiProperty({
    required: false,
    description: 'Base64 or vector path for drawn signatures',
  })
  @IsOptional()
  @IsString()
  signatureData?: string;
}

// Backward compatibility export (deprecated)
// Remove after clients migrate to SignRoleDto
export { SignRoleDto as RoleSignDto };
