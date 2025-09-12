import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: number) {
    return this.prisma.projects.findMany({
      where: {
        OR: [
          { owner_id: userId },
          { project_members: { some: { user_id: userId } } },
        ],
        active: true, // Only active projects
      },
      include: {
        clients: { select: { name: true } },
        project_members: {
          select: {
            users: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
                profile_image: true,
              },
            },
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async findOne(id: number, userId: number) {
    const project = await this.prisma.projects.findFirst({
      where: {
        id,
        OR: [
          { owner_id: userId },
          { project_members: { some: { user_id: userId } } },
        ],
        active: true,
      },
      include: {
        clients: true,
        project_members: {
          include: {
            users: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
                profile_image: true,
              },
            },
          },
        },
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found or access denied');
    }

    return project;
  }

  async create(data: CreateProjectDto, owner_id: number) {
    try {
      return await this.prisma.projects.create({
        data: {
          ...data,
          owner_id,
        },
        include: {
          clients: true,
          project_members: {
            include: {
              users: {
                select: {
                  id: true,
                  first_name: true,
                  last_name: true,
                  profile_image: true,
                },
              },
            },
          },
        },
      });
    } catch (error) {
      console.error('Create Project Error:', error);
      throw new Error('Failed to create project');
    }
  }

  async update(id: number, data: UpdateProjectDto, userId: number) {
    // Check if user has permission to update
    const project = await this.prisma.projects.findFirst({
      where: {
        id,
        owner_id: userId, // Only owner can update
        active: true,
      },
    });

    if (!project) {
      throw new ForbiddenException('Not authorized to update this project');
    }

    return this.prisma.projects.update({
      where: { id },
      data,
      include: {
        clients: true,
        project_members: {
          include: {
            users: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
                profile_image: true,
              },
            },
          },
        },
      },
    });
  }

  async delete(id: number, userId: number) {
    // Check if user has permission to delete
    const project = await this.prisma.projects.findFirst({
      where: {
        id,
        owner_id: userId, // Only owner can delete
        active: true,
      },
    });

    if (!project) {
      throw new ForbiddenException('Not authorized to delete this project');
    }

    // Soft delete
    return this.prisma.projects.update({
      where: { id },
      data: { active: false },
    });
  }
}
