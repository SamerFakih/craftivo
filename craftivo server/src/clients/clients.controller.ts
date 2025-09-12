import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  ParseIntPipe,
  Request,
  Patch,
  ForbiddenException,
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
import { UpdateClientDto } from './dto/update-client.dto';
import { AuthGuard } from '@nestjs/passport';

interface AuthenticatedUser {
  user_id: number;
  email: string;
  role: string;
}

@ApiTags('clients')
@ApiBearerAuth()
@Controller('clients')
@UseGuards(AuthGuard('jwt'))
export class ClientsController {
  constructor(private clientsService: ClientsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all clients for the authenticated user' })
  @ApiResponse({ status: 200, description: 'Return all clients.' })
  findAll(@Request() req: { user: AuthenticatedUser }) {
    return this.clientsService.findAll(req.user.user_id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a client by id' })
  @ApiParam({ name: 'id', type: 'number', description: 'Client ID' })
  @ApiResponse({ status: 200, description: 'Return the client.' })
  @ApiResponse({ status: 404, description: 'Client not found.' })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: { user: AuthenticatedUser },
  ) {
    return this.clientsService.findOne(id, req.user.user_id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new client' })
  @ApiBody({ type: CreateClientDto })
  @ApiResponse({
    status: 201,
    description: 'The client has been successfully created.',
  })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  create(
    @Body() createClientDto: CreateClientDto,
    @Request() req: { user: AuthenticatedUser },
  ) {
    return this.clientsService.create({
      ...createClientDto,
      created_by: req.user.user_id,
    });
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a client' })
  @ApiParam({ name: 'id', type: 'number', description: 'Client ID' })
  @ApiBody({ type: UpdateClientDto })
  @ApiResponse({
    status: 200,
    description: 'The client has been successfully updated.',
  })
  @ApiResponse({ status: 404, description: 'Client not found.' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateClientDto: UpdateClientDto,
    @Request() req: { user: AuthenticatedUser },
  ) {
    return this.clientsService.update(id, updateClientDto, req.user.user_id);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get clients by user ID (Self or Admin)' })
  @ApiParam({ name: 'userId', type: 'number', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'Return clients for the user.' })
  @ApiResponse({ status: 404, description: 'No clients found for the user.' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Cannot access other user data.',
  })
  findByUser(
    @Param('userId', ParseIntPipe) userId: number,
    @Request() req: { user: AuthenticatedUser },
  ) {
    // Users can only view their own clients, admins can view any user's clients
    if (req.user.user_id !== userId && req.user.role !== 'admin') {
      throw new ForbiddenException('You can only access your own clients');
    }
    return this.clientsService.findByUser(userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a client (Creator or Admin)' })
  @ApiParam({ name: 'id', type: 'number', description: 'Client ID' })
  @ApiResponse({
    status: 200,
    description: 'The client has been successfully deleted.',
  })
  @ApiResponse({ status: 404, description: 'Client not found.' })
  @ApiResponse({
    status: 403,
    description: "Forbidden - Cannot delete other user's clients.",
  })
  delete(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: { user: AuthenticatedUser },
  ) {
    return this.clientsService.delete(id, req.user.user_id, req.user.role);
  }
}
