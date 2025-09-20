import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, users as User } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(): Promise<User[]> {
    return this.prisma.users.findMany();
  }

  async findOne(id: number): Promise<User> {
    const user = await this.prisma.users.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.users.findUnique({ where: { email } });
  }

  async create(data: Prisma.usersCreateInput): Promise<User> {
    // NOTE: password should be hashed before calling this method (controller/service upstream)
    return this.prisma.users.create({ data });
  }

  async update(id: number, data: Prisma.usersUpdateInput): Promise<User> {
    try {
      return await this.prisma.users.update({ where: { id }, data });
    } catch (err: unknown) {
      if (
        err &&
        typeof err === 'object' &&
        'code' in err &&
        (err as { code: string }).code === 'P2025'
      ) {
        throw new NotFoundException('User not found');
      }
      throw err;
    }
  }

  async delete(id: number): Promise<User> {
    try {
      return await this.prisma.users.delete({ where: { id } });
    } catch (err: unknown) {
      if (
        err &&
        typeof err === 'object' &&
        'code' in err &&
        (err as { code: string }).code === 'P2025'
      ) {
        throw new NotFoundException('User not found');
      }
      throw err;
    }
  }
}
