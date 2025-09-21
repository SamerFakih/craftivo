import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsNotEmpty,
  MaxLength,
  IsObject,
} from 'class-validator';

export class CreateTeamDto {
  @ApiProperty({
    description: 'Team name',
    example: 'Development Team',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({
    description: 'Team description',
    example: 'Frontend and backend development team',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({
    description: 'Team slug for URLs',
    example: 'dev-team',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  slug?: string;

  @ApiPropertyOptional({
    description: 'Team settings and preferences',
    example: { notifications: true, defaultRate: 50 },
  })
  @IsOptional()
  @IsObject()
  settings?: any;
}
