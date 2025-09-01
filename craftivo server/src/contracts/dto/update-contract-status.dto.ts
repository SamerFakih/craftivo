import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { ContractStatus } from '@prisma/client';

export class UpdateContractStatusDto {
  @ApiProperty({
    enum: ContractStatus,
    description: 'New contract status',
    example: 'signed',
  })
  @IsEnum(ContractStatus)
  status: ContractStatus;
}
