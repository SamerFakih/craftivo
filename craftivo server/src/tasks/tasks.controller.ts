import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TasksService } from './tasks.service';
import { AuthGuard } from '@nestjs/passport';
import { UserId } from '../common/decorators/user-id.decorator';

@ApiTags('tasks')
@ApiBearerAuth()
@Controller('tasks')
@UseGuards(AuthGuard('jwt'))
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  @ApiOperation({ summary: 'Get all tasks' })
  @ApiQuery({
    name: 'project_id',
    required: false,
    description: 'Filter by project ID',
  })
  @ApiResponse({ status: 200, description: 'Return all tasks.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  findAll(@UserId() userId: number) {
    return this.tasksService.findAllByUser(userId);
  }

  @Get('my-tasks')
  @ApiOperation({ summary: 'Get tasks assigned to or created by current user' })
  @ApiResponse({ status: 200, description: 'Return user tasks.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  findMyTasks(@UserId() userId: number) {
    return this.tasksService.findByUser(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a task by id' })
  @ApiParam({ name: 'id', type: 'number', description: 'Task ID' })
  @ApiResponse({ status: 200, description: 'Return the task.' })
  @ApiResponse({ status: 404, description: 'Task not found.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  findOne(@Param('id', ParseIntPipe) id: number, @UserId() userId: number) {
    return this.tasksService.findOne(id, userId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new task' })
  @ApiBody({ type: CreateTaskDto })
  @ApiResponse({
    status: 201,
    description: 'The task has been successfully created.',
  })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  create(@Body() createTaskDto: CreateTaskDto, @UserId() userId: number) {
    return this.tasksService.create({
      ...createTaskDto,
      created_by: userId,
    });
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a task' })
  @ApiParam({ name: 'id', type: 'number', description: 'Task ID' })
  @ApiBody({ type: UpdateTaskDto })
  @ApiResponse({
    status: 200,
    description: 'The task has been successfully updated.',
  })
  @ApiResponse({ status: 404, description: 'Task not found.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTaskDto: UpdateTaskDto,
    @UserId() userId: number,
  ) {
    return this.tasksService.update(id, updateTaskDto, userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a task' })
  @ApiParam({ name: 'id', type: 'number', description: 'Task ID' })
  @ApiResponse({
    status: 200,
    description: 'The task has been successfully deleted.',
  })
  @ApiResponse({ status: 404, description: 'Task not found.' })
  delete(@Param('id', ParseIntPipe) id: number, @UserId() userId: number) {
    return this.tasksService.delete(id, userId);
  }
}
