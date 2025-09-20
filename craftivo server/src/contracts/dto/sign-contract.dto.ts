import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class SignContractDto {
  @ApiProperty({
    description: 'Digital signature',
    example: 'base64_signature_string',
  })
  @IsString()
  @IsNotEmpty()
  signature: string;

  @ApiProperty({
    description: 'Name of the person signing',
    example: 'John Doe',
  })
  @IsString()
  @IsNotEmpty()
  signedBy: string;
}
