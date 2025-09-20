import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class RegenerateContractDto {
  @ApiPropertyOptional({ description: 'Override contract value' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  contract_value?: number;

  @ApiPropertyOptional({ description: 'Style or tone hints' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(40, { each: true })
  styleHints?: string[];

  @ApiPropertyOptional({ description: 'Additional contextual adjustments' })
  @IsOptional()
  metadata?: Record<string, any>;
}
