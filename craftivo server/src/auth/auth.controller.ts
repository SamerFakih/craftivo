/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Body,
  Controller,
  Post,
  Res,
  Get,
  UseGuards,
  Request,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBody, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginUserDto } from './dto/login-user.dto';
import { SignupUserDto } from './dto/signup-user.dto';
import { JwtAuthGuard } from './jwt.guard'; // Change from './jwt-auth.guard' to './jwt.guard'

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Login a user' })
  @ApiBody({ type: LoginUserDto })
  @ApiResponse({ status: 200, description: 'User logged in successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async login(@Body() loginDto: LoginUserDto, @Res({ passthrough: true }) res) {
    try {
      const user = await this.authService.validateUser(
        loginDto.email,
        loginDto.password,
      );

      if (!user) {
        throw new UnauthorizedException('Invalid credentials');
      }

      const tokenData = await this.authService.login(user);

      // Set JWT cookie
      res.cookie('token', tokenData.access_token, {
        httpOnly: true,
        secure: false, // Set to true in production
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: '/',
      });

      return {
        message: 'User logged in successfully',
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid credentials');
    }
  }

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiBody({ type: SignupUserDto })
  @ApiResponse({
    status: 201,
    description: 'The user has been successfully created.',
  })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  async register(@Body() createUserDto: SignupUserDto) {
    try {
      const user = await this.authService.register(createUserDto);
      return {
        message: 'User registered successfully',
        user,
      };
    } catch (error) {
      throw new Error(error.message);
    }
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async getProfile(@Request() req) {
    const userId = req.user.userId;

    const user = await this.authService.findUserById(userId);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Since we already excluded password_hash in the select, just return user
    return user;
  }

  @Post('logout')
  @ApiOperation({ summary: 'Logout user' })
  async logout(@Res({ passthrough: true }) res) {
    res.clearCookie('token');
    return { message: 'Logged out successfully' };
  }
}
