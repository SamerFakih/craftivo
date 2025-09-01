import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.projects.findMany();
  }

  findOne(id: number) {
    return this.prisma.projects.findUnique({
      where: { id },
    });
  }

  async create(data: CreateProjectDto & { owner_id: number }) {
    if (!data.owner_id) {
      throw new Error('owner_id is required');
    }
    try {
      return await this.prisma.projects.create({ data });
    } catch (error) {
      console.error('Create Project Error:', error);
      throw new Error('Failed to create project');
    }
  }

  update(id: number, data: CreateProjectDto) {
    return this.prisma.projects.update({
      where: { id },
      data,
    });
  }

  delete(id: number) {
    return this.prisma.projects.delete({
      where: { id },
    });
  }
}
