/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Response } from 'express'; // ✅ Use 'import type'
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { LoginUserDto, AuthResponseDto } from './dto';
import * as bcrypt from 'bcrypt';
import { UserProfileDto } from './dto/user-profile.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(
    createUserDto: CreateUserDto,
    response: Response,
  ): Promise<AuthResponseDto> {
    this.logger.log(`Registering user: ${createUserDto.email}`);

    // Check if user exists
    const existingUser = await this.prisma.users.findUnique({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const saltRounds = 12;
    const password_hash = await bcrypt.hash(createUserDto.password, saltRounds);

    // Create user
    const { password, ...userData } = createUserDto;
    const user = await this.prisma.users.create({
      data: {
        email: userData.email,
        first_name: userData.first_name,
        last_name: userData.last_name,
        password_hash,
      },
    });

    // Generate JWT and set cookie
    const tokens = await this.generateTokens(user);
    this.setAuthCookie(response, tokens.access_token);

    this.logger.log(`User registered successfully: ${user.id}`);

    return {
      user_id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
      access_token: tokens.access_token,
    };
  }

  async login(
    loginDto: LoginUserDto,
    response: Response,
  ): Promise<AuthResponseDto> {
    this.logger.log(`Login attempt: ${loginDto.email}`);

    // Find user
    const user = await this.prisma.users.findUnique({
      where: { email: loginDto.email },
    });

    if (
      !user ||
      !(await bcrypt.compare(loginDto.password, user.password_hash))
    ) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.active) {
      throw new UnauthorizedException('Account is deactivated');
    }

    // Generate JWT and set cookie
    const tokens = await this.generateTokens(user);
    this.setAuthCookie(response, tokens.access_token);

    this.logger.log(`User logged in successfully: ${user.id}`);

    return {
      user_id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
      access_token: tokens.access_token,
    };
  }

  async getProfile(userId: number): Promise<UserProfileDto> {
    const user = await this.prisma.users.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        first_name: true,
        last_name: true,
        role: true,
        profile_image: true,
        timezone: true,
        business_name: true,
        website: true,
        phone: true,
        location: true,
        hourly_rate: true,
        email_verified: true,
        active: true,
        created_at: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // ✅ Fix Decimal conversion
    return {
      ...user,
      hourly_rate: user.hourly_rate ? user.hourly_rate.toString() : undefined,
    } as UserProfileDto;
  }

  async logout(response: Response): Promise<{ message: string }> {
    response.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });

    return { message: 'Logged out successfully' };
  }

  private async generateTokens(user: any) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  private setAuthCookie(response: Response, token: string): void {
    response.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/',
    });
  }

  private sanitizeUser(user: any) {
    const { password_hash, ...sanitizedUser } = user;
    return sanitizedUser;
  }
}
