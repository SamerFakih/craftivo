/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}
  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (!user || !user.password_hash || !password) {
      return null;
    }
    if (user && (await bcrypt.compare(password, user.password_hash))) {
      const { password_hash, ...result } = user;
      return result;
    }
    return null;
  }
  async login(user: any) {
    if (!user) {
      throw new Error('Invalid credentials');
    }
    const payload = { email: user.email, userId: user.id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
      },
    };
  }

  async register(userData: any) {
    const { password, ...rest } = userData;

    if (!password) {
      throw new Error('Password is required');
    }

    // Check if user already exists
    const existingUser = await this.usersService.findByEmail(userData.email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    const password_hash = await bcrypt.hash(password, 10);
    const newUser = await this.usersService.create({ ...rest, password_hash });

    // Remove password_hash from response
    const { password_hash: _, ...userWithoutPassword } = newUser;
    return userWithoutPassword;
  }
}
