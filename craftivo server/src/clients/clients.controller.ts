/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  Req,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-clients.dto';
import { AuthGuard } from '@nestjs/passport';

@ApiTags('clients')
@ApiBearerAuth()
@Controller('clients')
export class ClientsController {
  constructor(private clientsService: ClientsService) {}

  @UseGuards(AuthGuard('jwt'))
  @Get()
  @ApiOperation({ summary: 'Get all clients' })
  @ApiResponse({ status: 200, description: 'Return all clients.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  findAll() {
    return this.clientsService.findAll();
  }

  @UseGuards(AuthGuard('jwt'))
  @Get(':id')
  @ApiOperation({ summary: 'Get a client by id' })
  @ApiParam({ name: 'id', type: 'number', description: 'Client ID' })
  @ApiResponse({ status: 200, description: 'Return the client.' })
  @ApiResponse({ status: 404, description: 'Client not found.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.clientsService.findOne(id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post()
  @ApiOperation({ summary: 'Create a new client' })
  @ApiBody({ type: CreateClientDto })
  @ApiResponse({
    status: 201,
    description: 'The client has been successfully created.',
  })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  create(@Body() createClientDto: CreateClientDto, @Req() req) {
    const userId = req.user.userId;
    return this.clientsService.create({
      ...createClientDto,
      created_by: userId,
    });
  }

  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Update a client' })
  @ApiParam({ name: 'id', type: 'number', description: 'Client ID' })
  @ApiBody({ type: CreateClientDto })
  @ApiResponse({
    status: 200,
    description: 'The client has been successfully updated.',
  })
  @ApiResponse({ status: 404, description: 'Client not found.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateClientDto: CreateClientDto,
    @Req() req,
  ) {
    const userId = req.user.userId;

    return this.clientsService.update(id, updateClientDto, userId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('user/:userId')
  @ApiOperation({ summary: 'Get clients by user ID' })
  @ApiParam({ name: 'userId', type: 'number', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'Return clients for the user.' })
  @ApiResponse({ status: 404, description: 'No clients found for the user.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  findByUser(@Param('userId', ParseIntPipe) userId: number) {
    return this.clientsService.findByUser(userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a client' })
  @ApiParam({ name: 'id', type: 'number', description: 'Client ID' })
  @ApiResponse({
    status: 200,
    description: 'The client has been successfully deleted.',
  })
  @ApiResponse({ status: 404, description: 'Client not found.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  delete(@Param('id') id: number) {
    return this.clientsService.delete(id);
  }
}
