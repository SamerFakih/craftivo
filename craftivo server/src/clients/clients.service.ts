import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateClientDto } from './dto/create-clients.dto';

@Injectable()
export class ClientsService {
  clientsService: any;
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.clients.findMany();
  }

  findOne(id: number) {
    return this.prisma.clients.findUnique({ where: { id } });
  }

  async create(data: CreateClientDto & { created_by: number }) {
    if (!data.created_by) {
      throw new Error('created_by is required');
    }
    try {
      return await this.prisma.clients.create({ data });
    } catch (error) {
      console.error('Create Client Error:', error);
      throw new Error('Failed to create client');
    }
  }

  async update(id: number, data: CreateClientDto, userId: any) {
    const client = await this.findOne(id);
    if (!client) {
      throw new HttpException('Client not found', HttpStatus.NOT_FOUND);
    }
    if (client.created_by !== userId) {
      throw new HttpException(
        'You do not have permission to update this client',
        HttpStatus.FORBIDDEN,
      );
    }
    try {
      return await this.prisma.clients.update({ where: { id }, data });
    } catch (error) {
      console.error('Update Client Error:', error);
      throw new Error('Failed to update client');
    }
  }
  async findByUser(userId: number) {
    return this.prisma.clients.findMany({ where: { created_by: userId } });
  }
  async delete(id: number) {
    return this.prisma.clients.delete({ where: { id } });
  }
}
