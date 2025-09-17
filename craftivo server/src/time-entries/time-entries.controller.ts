import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Delete,
  UseGuards,
  HttpCode,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
import { TimeEntriesService } from './time-entries.service';
import { CreateTimeEntriesDto } from './dto/create-time-entries.dto';
import { UpdateTimeEntriesDto } from './dto/update-time-entries.dto';
import { TimeEntriesFiltersDto } from './dto/time-entries-filters.dto';
import { AuthGuard } from '@nestjs/passport';
import { UserId } from '../common/decorators/user-id.decorator';

@ApiTags('time-entries')
@ApiBearerAuth()
@Controller('time-entries')
@UseGuards(AuthGuard('jwt'))
export class TimeEntriesController {
  constructor(private readonly timeEntriesService: TimeEntriesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new time entry' })
  @ApiResponse({ status: 201, description: 'Time entry created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid data' })
  @ApiBody({ type: CreateTimeEntriesDto })
  async create(
    @Body() createTimeEntriesDto: CreateTimeEntriesDto,
    @UserId() userId: number,
  ) {
    return this.timeEntriesService.create({
      ...createTimeEntriesDto,
      user_id: userId,
    });
  }

  @Get()
  @ApiOperation({ summary: 'Get all time entries' })
  @ApiResponse({ status: 200, description: 'List of time entries' })
  async findAll(
    @Query() filters: TimeEntriesFiltersDto,
    @UserId() userId: number,
  ) {
    return this.timeEntriesService.findAll({
      ...filters,
      user_id: userId,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a time entry by ID' })
  @ApiResponse({ status: 200, description: 'Time entry found' })
  @ApiResponse({ status: 404, description: 'Time entry not found' })
  @ApiParam({ name: 'id', type: 'number' })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @UserId() userId: number,
  ) {
    return this.timeEntriesService.findOne(id, userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a time entry' })
  @ApiResponse({ status: 200, description: 'Time entry updated successfully' })
  @ApiResponse({ status: 404, description: 'Time entry not found' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiBody({ type: UpdateTimeEntriesDto })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTimeEntriesDto: UpdateTimeEntriesDto,
    @UserId() userId: number,
  ) {
    return this.timeEntriesService.update(id, userId, updateTimeEntriesDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a time entry' })
  @ApiResponse({ status: 204, description: 'Time entry deleted successfully' })
  @ApiResponse({ status: 404, description: 'Time entry not found' })
  @ApiParam({ name: 'id', type: 'number' })
  @HttpCode(204)
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @UserId() userId: number,
  ) {
    return this.timeEntriesService.remove(id, { user_id: userId });
  }
}
