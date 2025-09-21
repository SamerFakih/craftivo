import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { SignatureType } from './role-sign.dto';

export class PublicSignDto {
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
