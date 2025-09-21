import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateClientDto } from './dto/create-clients.dto';
import { UpdateClientDto } from './dto/update-client.dto';

@Injectable()
export class ClientsService {
  clientsService: any;
  constructor(private prisma: PrismaService) {}

  findAll(userId: number) {
    return this.prisma.clients.findMany({
      where: { created_by: userId },
    });
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
    // First check if the client exists and user has permission
    const existingClient = await this.findOne(id, userId);

    if (!existingClient) {
      throw new Error('Client not found or unauthorized');
    }

    try {
      return await this.prisma.clients.update({
        where: { id },
        data: updateClientDto,
      });
    } catch (error) {
      console.error('Update Client Error:', error);
      throw new Error('Failed to update client');
    }
  }

  async findByUser(userId: number) {
    return this.prisma.clients.findMany({ where: { created_by: userId } });
  }
  async delete(id: number, userId: number, userRole: string) {
    // First check if the client exists and user has permission
    const client = await this.prisma.clients.findUnique({
      where: { id },
    });

    if (!client) {
      throw new Error('Client not found');
    }

    // Only the creator or admin can delete
    if (client.created_by !== userId && userRole !== 'admin') {
      throw new Error('Unauthorized to delete this client');
    }

    return this.prisma.clients.delete({ where: { id } });
  }
}
