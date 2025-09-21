import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { TeamsService } from './teams.service';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { AddTeamMemberDto } from './dto/add-team-member.dto';
import { TeamRole } from '@prisma/client';
import { UserId } from '../common/decorators/user-id.decorator';

@ApiTags('teams')
@ApiBearerAuth()
@Controller('teams')
@UseGuards(AuthGuard('jwt'))
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new team' })
  @ApiResponse({
    status: 201,
    description: 'The team has been successfully created.',
  })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  create(@Body() createTeamDto: CreateTeamDto, @UserId() userId: number) {
    return this.teamsService.create(createTeamDto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all teams for the authenticated user' })
  @ApiResponse({
    status: 200,
    description: 'List of teams where user is owner or member.',
  })
  findAll(@UserId() userId: number) {
    return this.teamsService.findAll(userId);
  }

  @Get('members')
  @ApiOperation({
    summary: 'Get all team members across user teams (normalized)',
  })
  @ApiResponse({
    status: 200,
    description:
      'Flat list of unique members across all teams accessible to the user.',
  })
  getAllMembers(@UserId() userId: number) {
    return this.teamsService.getMembers(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get team by ID' })
  @ApiParam({ name: 'id', description: 'Team ID', type: Number })
  @ApiResponse({ status: 200, description: 'Team details with members.' })
  @ApiResponse({ status: 404, description: 'Team not found.' })
  findOne(@Param('id', ParseIntPipe) id: number, @UserId() userId: number) {
    return this.teamsService.findOne(id, userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update team details' })
  @ApiParam({ name: 'id', description: 'Team ID', type: Number })
  @ApiResponse({
    status: 200,
    description: 'The team has been successfully updated.',
  })
  @ApiResponse({ status: 404, description: 'Team not found.' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions.' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTeamDto: UpdateTeamDto,
    @UserId() userId: number,
  ) {
    return this.teamsService.update(id, updateTeamDto, userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete team (soft delete)' })
  @ApiParam({ name: 'id', description: 'Team ID', type: Number })
  @ApiResponse({
    status: 200,
    description: 'The team has been successfully deleted.',
  })
  @ApiResponse({ status: 404, description: 'Team not found.' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions.' })
  remove(@Param('id', ParseIntPipe) id: number, @UserId() userId: number) {
    return this.teamsService.remove(id, userId);
  }

  @Get(':id/members')
  @ApiOperation({ summary: 'Get team members' })
  @ApiParam({ name: 'id', description: 'Team ID', type: Number })
  @ApiResponse({ status: 200, description: 'List of team members.' })
  @ApiResponse({ status: 404, description: 'Team not found.' })
  getMembers(@Param('id', ParseIntPipe) id: number, @UserId() userId: number) {
    return this.teamsService.getTeamMembers(id, userId);
  }

  @Post(':id/members')
  @ApiOperation({ summary: 'Add member to team' })
  @ApiParam({ name: 'id', description: 'Team ID', type: Number })
  @ApiResponse({
    status: 201,
    description: 'Member has been successfully added to the team.',
  })
  @ApiResponse({ status: 400, description: 'User already a member.' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions.' })
  addMember(
    @Param('id', ParseIntPipe) id: number,
    @Body() addMemberDto: AddTeamMemberDto,
    @UserId() userId: number,
  ) {
    return this.teamsService.addMember(id, addMemberDto, userId);
  }

  @Delete(':id/members/:memberId')
  @ApiOperation({ summary: 'Remove member from team' })
  @ApiParam({ name: 'id', description: 'Team ID', type: Number })
  @ApiParam({ name: 'memberId', description: 'Member user ID', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Member has been successfully removed from the team.',
  })
  @ApiResponse({ status: 404, description: 'Team or member not found.' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions.' })
  removeMember(
    @Param('id', ParseIntPipe) id: number,
    @Param('memberId', ParseIntPipe) memberId: number,
    @UserId() userId: number,
  ) {
    return this.teamsService.removeMember(id, memberId, userId);
  }

  @Patch(':id/members/:memberId/role')
  @ApiOperation({ summary: 'Update team member role' })
  @ApiParam({ name: 'id', description: 'Team ID', type: Number })
  @ApiParam({ name: 'memberId', description: 'Member user ID', type: Number })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        role: {
          type: 'string',
          enum: ['owner', 'admin', 'member'],
          example: 'admin',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Member role has been successfully updated.',
  })
  @ApiResponse({ status: 404, description: 'Team or member not found.' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions.' })
  updateMemberRole(
    @Param('id', ParseIntPipe) id: number,
    @Param('memberId', ParseIntPipe) memberId: number,
    @Body('role') role: TeamRole,
    @UserId() userId: number,
  ) {
    return this.teamsService.updateMemberRole(id, memberId, role, userId);
  }
}
