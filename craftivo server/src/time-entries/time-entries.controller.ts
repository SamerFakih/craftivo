/* eslint-disable @typescript-eslint/no-unsafe-return */
import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
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
import { Delete } from '@nestjs/common/decorators/http/request-mapping.decorator';

@ApiTags('time-entries')
@ApiBearerAuth()
@Controller('time-entries')
export class TimeEntriesController {
  constructor(private readonly timeEntriesService: TimeEntriesService) {}

  // Create a new time entry
  @ApiOperation({ summary: 'Create a new time entry' })
  @ApiResponse({ status: 201, description: 'Time entry created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid data' })
  @ApiBody({ type: CreateTimeEntriesDto })
  @Post()
  async create(@Body() createTimeEntriesDto: CreateTimeEntriesDto) {
    return this.timeEntriesService.create(createTimeEntriesDto);
  }

  // Get all time entries
  @ApiOperation({ summary: 'Get all time entries' })
  @ApiResponse({ status: 200, description: 'List of time entries' })
  @Get()
  async findAll(@Query() filters: TimeEntriesFiltersDto) {
    return this.timeEntriesService.findAll(filters);
  }

  // Get a single time entry by ID
  @ApiOperation({ summary: 'Get a time entry by ID' })
  @ApiResponse({ status: 200, description: 'Time entry found' })
  @ApiResponse({ status: 404, description: 'Time entry not found' })
  @ApiParam({ name: 'id', type: 'number' })
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.timeEntriesService.findOne(id);
  }

  // Update a time entry
  @ApiOperation({ summary: 'Update a time entry' })
  @ApiResponse({ status: 200, description: 'Time entry updated successfully' })
  @ApiResponse({ status: 404, description: 'Time entry not found' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiBody({ type: UpdateTimeEntriesDto })
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTimeEntriesDto: UpdateTimeEntriesDto,
  ) {
    return this.timeEntriesService.update(id, updateTimeEntriesDto);
  }

  // Delete a time entry
  @ApiOperation({ summary: 'Delete a time entry' })
  @ApiResponse({ status: 204, description: 'Time entry deleted successfully' })
  @ApiResponse({ status: 404, description: 'Time entry not found' })
  @ApiParam({ name: 'id', type: 'number' })
  @Delete(':id')
  async remove(@Param('id') id: number) {
    return this.timeEntriesService.remove(id);
  }
}
