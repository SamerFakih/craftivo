/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
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

@ApiTags('teams')
@ApiBearerAuth()
@Controller('teams')
@UseGuards(AuthGuard('jwt'))
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @ApiOperation({ summary: 'Create a new team' })
  @ApiResponse({
    status: 201,
    description: 'The team has been successfully created.',
  })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  @Post()
  create(@Body() createTeamDto: CreateTeamDto, @Request() req) {
    return this.teamsService.create(createTeamDto, req.user.userId);
  }

  @ApiOperation({ summary: 'Get all teams for the authenticated user' })
  @ApiResponse({
    status: 200,
    description: 'List of teams where user is owner or member.',
  })
  @Get()
  findAll(@Request() req) {
    return this.teamsService.findAll(req.user.userId);
  }

  @ApiOperation({ summary: 'Get team by ID' })
  @ApiParam({ name: 'id', description: 'Team ID' })
  @ApiResponse({
    status: 200,
    description: 'Team details with members.',
  })
  @ApiResponse({ status: 404, description: 'Team not found.' })
  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.teamsService.findOne(+id, req.user.userId);
  }

  @ApiOperation({ summary: 'Update team details' })
  @ApiParam({ name: 'id', description: 'Team ID' })
  @ApiResponse({
    status: 200,
    description: 'The team has been successfully updated.',
  })
  @ApiResponse({ status: 404, description: 'Team not found.' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions.' })
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateTeamDto: UpdateTeamDto,
    @Request() req,
  ) {
    return this.teamsService.update(+id, updateTeamDto, req.user.userId);
  }

  @ApiOperation({ summary: 'Delete team (soft delete)' })
  @ApiParam({ name: 'id', description: 'Team ID' })
  @ApiResponse({
    status: 200,
    description: 'The team has been successfully deleted.',
  })
  @ApiResponse({ status: 404, description: 'Team not found.' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions.' })
  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.teamsService.remove(+id, req.user.userId);
  }

  @ApiOperation({ summary: 'Get team members' })
  @ApiParam({ name: 'id', description: 'Team ID' })
  @ApiResponse({
    status: 200,
    description: 'List of team members.',
  })
  @ApiResponse({ status: 404, description: 'Team not found.' })
  @Get(':id/members')
  getMembers(@Param('id') id: string, @Request() req) {
    return this.teamsService.getTeamMembers(+id, req.user.userId);
  }

  @ApiOperation({ summary: 'Add member to team' })
  @ApiParam({ name: 'id', description: 'Team ID' })
  @ApiResponse({
    status: 201,
    description: 'Member has been successfully added to the team.',
  })
  @ApiResponse({ status: 400, description: 'User already a member.' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions.' })
  @Post(':id/members')
  addMember(
    @Param('id') id: string,
    @Body() addMemberDto: AddTeamMemberDto,
    @Request() req,
  ) {
    return this.teamsService.addMember(+id, addMemberDto, req.user.userId);
  }

  @ApiOperation({ summary: 'Remove member from team' })
  @ApiParam({ name: 'id', description: 'Team ID' })
  @ApiParam({ name: 'memberId', description: 'Member user ID' })
  @ApiResponse({
    status: 200,
    description: 'Member has been successfully removed from the team.',
  })
  @ApiResponse({ status: 404, description: 'Team or member not found.' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions.' })
  @Delete(':id/members/:memberId')
  removeMember(
    @Param('id') id: string,
    @Param('memberId') memberId: string,
    @Request() req,
  ) {
    return this.teamsService.removeMember(+id, +memberId, req.user.userId);
  }

  @ApiOperation({ summary: 'Update team member role' })
  @ApiParam({ name: 'id', description: 'Team ID' })
  @ApiParam({ name: 'memberId', description: 'Member user ID' })
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
  @Patch(':id/members/:memberId/role')
  updateMemberRole(
    @Param('id') id: string,
    @Param('memberId') memberId: string,
    @Body('role') role: TeamRole,
    @Request() req,
  ) {
    return this.teamsService.updateMemberRole(
      +id,
      +memberId,
      role,
      req.user.userId,
    );
  }
}
