/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.users.findMany();
  }

  findOne(id: number) {
    return this.prisma.users.findUnique({ where: { id } });
  }

  findByEmail(email: string) {
    return this.prisma.users.findUnique({ where: { email } });
  }

  async create(data: any) {
    if (!data.password_hash) {
      throw new Error('Password is required');
    }
    const { password, ...rest } = data;
    return this.prisma.users.create({
      data: { ...rest },
    });
  }

  async update(
    id: number,
    data: Partial<{
      first_name: string;
      last_name: string;
      email: string;
      phone: string;
      profile_image: string;
      website: string;
      role: UserRole;
      timezone: string;
      hourly_rate: number;
      tax_id: string;
      bio: string;
      location: string;
      business_name: string;
      business_address: string;
    }>,
  ) {
    try {
      return await this.prisma.users.update({ where: { id }, data });
    } catch (error) {
      console.error('Update user error:', error);
      throw new Error('Failed to update user');
    }
  }

  async delete(id: number) {
    try {
      return await this.prisma.users.delete({ where: { id } });
    } catch (error) {
      console.error('Delete user error:', error);
      throw new Error('Failed to delete user');
    }
  }
}
