/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.prisma.users.findUnique({
      where: { email },
    });

    if (user && (await bcrypt.compare(password, user.password_hash))) {
      const { password_hash, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    const payload = { email: user.email, sub: user.id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async register(userData: any) {
    // Check if user already exists
    const existingUser = await this.prisma.users.findUnique({
      where: { email: userData.email },
    });

    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Hash the password
    const saltRounds = 12;
    const password_hash = await bcrypt.hash(userData.password, saltRounds);

    // Create user without password, add password_hash
    const { password, ...rest } = userData;
    const newUser = await this.prisma.users.create({
      data: {
        ...rest,
        password_hash,
      },
    });

    // Remove password_hash from response
    const { password_hash: _, ...userResponse } = newUser;
    return userResponse;
  }

  async findUserById(id: number) {
    return this.prisma.users.findUnique({
      where: { id },
      select: {
        id: true,
        uuid: true,
        email: true,
        first_name: true,
        last_name: true,
        role: true,
        profile_image: true,
        timezone: true,
        business_name: true,
        business_address: true,
        website: true,
        phone: true,
        bio: true,
        location: true,
        hourly_rate: true,
        email_verified: true,
        active: true,
        created_at: true,
        updated_at: true,
        // password_hash excluded for security
      },
    });
  }
}
