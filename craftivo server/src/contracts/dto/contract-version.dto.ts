import { ApiProperty } from '@nestjs/swagger';

export class ContractVersionDto {
  @ApiProperty() id!: number;
  @ApiProperty() contract_id!: number;
  @ApiProperty() version_number!: number;
  @ApiProperty() content!: string;
  @ApiProperty({
    description: 'Source of generation: manual | regenerate | revert | ai',
    example: 'manual',
  })
  generated_by!: string;
  @ApiProperty({ required: false, description: 'Arbitrary metadata JSON' })
  metadata?: Record<string, unknown> | null;
  @ApiProperty() created_at!: Date;
}
