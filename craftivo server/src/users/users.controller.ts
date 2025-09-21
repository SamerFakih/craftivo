import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
  ParseIntPipe,
  Request,
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
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AuthGuard } from '@nestjs/passport';

interface AuthenticatedUser {
  user_id: number;
  email: string;
  role: string;
}

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(AuthGuard('jwt'))
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'Get all users (Admin only)' })
  @ApiResponse({ status: 200, description: 'Return all users.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required.',
  })
  findAll(@Request() req: { user: AuthenticatedUser }) {
    // Only admins can view all users
    if (req.user?.role !== 'admin') {
      throw new ForbiddenException('Admin access required');
    }
    return this.usersService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID (Self or Admin)' })
  @ApiResponse({ status: 200, description: 'Return user data.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Cannot access other user data.',
  })
  @ApiResponse({ status: 404, description: 'User not found.' })
  findOne(
    @Param('id') id: string,
    @Request() req: { user: AuthenticatedUser },
  ) {
    const userId = parseInt(id);

    // Users can only view their own profile, admins can view any profile
    if (req.user?.user_id !== userId && req.user?.role !== 'admin') {
      throw new ForbiddenException('You can only access your own profile');
    }

    return this.usersService.findOne(userId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new user (Admin only)' })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({
    status: 201,
    description: 'The user has been successfully created.',
  })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required.',
  })
  create(
    @Body() createUserDto: CreateUserDto,
    @Request() req: { user: AuthenticatedUser },
  ) {
    // Only admins can create new users
    if (req.user?.role !== 'admin') {
      throw new ForbiddenException('Admin access required');
    }
    const { password, ...rest } = createUserDto;
    return this.usersService.create({ ...rest, password_hash: password });
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a user (Self or Admin)' })
  @ApiParam({ name: 'id', type: 'number', description: 'User ID' })
  @ApiBody({ type: UpdateUserDto })
  @ApiResponse({
    status: 200,
    description: 'The user has been successfully updated.',
  })
  @ApiResponse({ status: 404, description: 'User not found.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Cannot update other user data.',
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: Partial<UpdateUserDto>,
    @Request() req: { user: AuthenticatedUser },
  ) {
    // Users can only update their own profile, admins can update any profile
    if (req.user?.user_id !== id && req.user?.role !== 'admin') {
      throw new ForbiddenException('You can only update your own profile');
    }

    // Prisma update input - ensure only provided fields are passed
    const data: import('@prisma/client').Prisma.usersUpdateInput = {
      ...updateUserDto,
    };
    return this.usersService.update(id, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a user (Admin only)' })
  @ApiParam({ name: 'id', type: 'number', description: 'User ID' })
  @ApiResponse({
    status: 200,
    description: 'The user has been successfully deleted.',
  })
  @ApiResponse({ status: 404, description: 'User not found.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required.',
  })
  delete(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: { user: AuthenticatedUser },
  ) {
    // Only admins can delete users
    if (req.user?.role !== 'admin') {
      throw new ForbiddenException('Admin access required');
    }

    return this.usersService.delete(id);
  }
}
