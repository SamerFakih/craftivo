/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ContractStatus } from '@prisma/client';

export class ContractResponseDto {
  @ApiProperty() id!: number;
  @ApiProperty() title!: string;
  @ApiProperty({ enum: ContractStatus }) status!: ContractStatus;
  @ApiProperty() content!: string;
  @ApiPropertyOptional() clientName?: string;
  @ApiPropertyOptional() freelancerName?: string;
  @ApiPropertyOptional() contract_value?: number;
  @ApiPropertyOptional() currency?: string;
  @ApiPropertyOptional() start_date?: Date | string;
  @ApiPropertyOptional() end_date?: Date | string;
  @ApiPropertyOptional() signed_by_client?: string;
  @ApiPropertyOptional() signed_by_freelancer?: string;
  @ApiPropertyOptional() created_at?: Date | string;
  @ApiPropertyOptional() updated_at?: Date | string;
  // Allow pass-through of any extra fields without strict typing explosion
  [key: string]: any;
}

// Mapper util (kept here for proximity; can be moved to a dedicated mapper folder later)
export function mapContract(entity: any): ContractResponseDto {
  if (!entity) return entity;
  return {
    ...entity,
    clientName: entity.clientName || entity.clients?.name || entity.client_name,
    freelancerName:
      entity.freelancerName ||
      entity.signed_by_freelancer ||
      entity.users?.name ||
      entity.freelancer_name,
  } as ContractResponseDto;
}

export function mapContractsArray(list: any[]): ContractResponseDto[] {
  if (!Array.isArray(list)) return [];
  return list.map(mapContract);
}
