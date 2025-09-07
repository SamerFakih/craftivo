/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateClientDto } from './dto/create-clients.dto';
import { UpdateClientDto } from './dto/update-client.dto';

@Injectable()
export class ClientsService {
  clientsService: any;
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.clients.findMany();
  }

  findOne(id: number, userId: number) {
    return this.prisma.clients.findUnique({
      where: { id, created_by: userId },
    });
  }

  async create(createClientDto: CreateClientDto & { created_by: number }) {
    if (!createClientDto.created_by) {
      throw new Error('created_by is required');
    }
    try {
      return await this.prisma.clients.create({ data: createClientDto });
    } catch (error) {
      console.error('Create Client Error:', error);
      throw new Error('Failed to create client');
    }
  }

  async update(id: number, updateClientDto: UpdateClientDto, userId: number) {
    const client = await this.findOne(id, userId);
    Object.assign(updateClientDto);
    return client;
  }

  async findByUser(userId: number) {
    return this.prisma.clients.findMany({ where: { created_by: userId } });
  }
  async delete(id: number) {
    return this.prisma.clients.delete({ where: { id } });
  }
}
