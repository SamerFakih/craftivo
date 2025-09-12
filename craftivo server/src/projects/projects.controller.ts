/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectsService } from './projects.service';
import { AuthGuard } from '@nestjs/passport';

@ApiTags('projects')
@ApiBearerAuth()
@Controller('projects')
@UseGuards(AuthGuard('jwt'))
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all projects for the current user' })
  @ApiResponse({
    status: 200,
    description: 'Return all projects for the user.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  findAll(@Request() req) {
    const userId = req.user.user_id;
    return this.projectsService.findAll(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a project by id' })
  @ApiParam({ name: 'id', type: 'number', description: 'Project ID' })
  @ApiResponse({ status: 200, description: 'Return the project.' })
  @ApiResponse({ status: 404, description: 'Project not found.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  findOne(@Param('id', ParseIntPipe) id: number, @Request() req) {
    const userId = req.user.user_id;
    return this.projectsService.findOne(id, userId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new project' })
  @ApiBody({ type: CreateProjectDto })
  @ApiResponse({
    status: 201,
    description: 'The project has been successfully created.',
  })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  create(@Body() createProjectDto: CreateProjectDto, @Request() req) {
    const userId = req.user.user_id;
    console.log('Creating project for user ID:', userId);
    return this.projectsService.create(createProjectDto, userId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a project' })
  @ApiParam({ name: 'id', type: 'number', description: 'Project ID' })
  @ApiBody({ type: UpdateProjectDto })
  @ApiResponse({
    status: 200,
    description: 'The project has been successfully updated.',
  })
  @ApiResponse({ status: 404, description: 'Project not found.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateProjectDto: UpdateProjectDto,
    @Request() req,
  ) {
    const userId = req.user.user_id;
    return this.projectsService.update(id, updateProjectDto, userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a project' })
  @ApiParam({ name: 'id', type: 'number', description: 'Project ID' })
  @ApiResponse({
    status: 200,
    description: 'The project has been successfully deleted.',
  })
  @ApiResponse({ status: 404, description: 'Project not found.' })
  delete(@Param('id', ParseIntPipe) id: number, @Request() req) {
    const userId = req.user.user_id;
    return this.projectsService.delete(id, userId);
  }
}
