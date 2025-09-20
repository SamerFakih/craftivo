import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsArray,
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
} from 'class-validator';

class SendRecipientDto {
  @ApiProperty({ enum: ['client', 'freelancer'] })
  @IsIn(['client', 'freelancer'])
  role!: 'client' | 'freelancer';

  @ApiProperty({ example: 'client@example.com' })
  @IsEmail()
  email!: string;
}

export class SendContractDto {
  @ApiProperty({ type: [SendRecipientDto] })
  @IsArray()
  @ArrayMinSize(1)
  recipients!: SendRecipientDto[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  message?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  subject?: string;
}
