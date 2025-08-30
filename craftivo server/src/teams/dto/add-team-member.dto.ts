import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsEnum,
  IsOptional,
  IsObject,
  IsDecimal,
  Min,
} from 'class-validator';
import { TeamRole } from '@prisma/client';

export class AddTeamMemberDto {
  @ApiProperty({
    description: 'User ID to add to the team',
    example: 1,
  })
  @IsInt()
  @Min(1)
  user_id: number;

  @ApiPropertyOptional({
    enum: TeamRole,
    description: 'Role of the team member',
    example: 'member',
  })
  @IsOptional()
  @IsEnum(TeamRole)
  role?: TeamRole;

  @ApiPropertyOptional({
    description: 'Hourly rate for this team member',
    example: 50.0,
  })
  @IsOptional()
  @IsDecimal()
  @Min(0)
  hourly_rate?: number;

  @ApiPropertyOptional({
    description: 'Permissions for this team member',
    example: { canManageProjects: true, canInviteMembers: false },
  })
  @IsOptional()
  @IsObject()
  permissions?: any;
}
