/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';

@Injectable()
export class TasksService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.tasks.findMany({
      where: { active: true },
      include: {
        projects: {
          select: { id: true, name: true },
        },
        assigned_user: {
          select: { id: true, first_name: true, last_name: true },
        },
        creator: {
          select: { id: true, first_name: true, last_name: true },
        },
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async findOne(id: number) {
    const task = await this.prisma.tasks.findUnique({
      where: { id },
      include: {
        projects: true,
        assigned_user: {
          select: { id: true, first_name: true, last_name: true, email: true },
        },
        creator: {
          select: { id: true, first_name: true, last_name: true, email: true },
        },
        task_comments: {
          include: {
            users: {
              select: { id: true, first_name: true, last_name: true },
            },
          },
          orderBy: { created_at: 'desc' },
        },
        task_attachments: true,
      },
    });

    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    return task;
  }

  async create(data: CreateTaskDto & { created_by: number }) {
    try {
      const taskData = {
        ...data,
        due_date: data.due_date ? new Date(data.due_date) : undefined,
      };
      return await this.prisma.tasks.create({
        data: taskData,
        include: {
          projects: true,
          assigned_user: {
            select: { id: true, first_name: true, last_name: true },
          },
          creator: {
            select: { id: true, first_name: true, last_name: true },
          },
        },
      });
    } catch (error) {
      console.error('Error creating task:', error);
      throw new Error('Failed to create task');
    }
  }

  async update(id: number, data: CreateTaskDto) {
    try {
      const taskData = {
        ...data,
        due_date: data.due_date ? new Date(data.due_date) : undefined,
      };
      const task = await this.prisma.tasks.findUnique({ where: { id } });
      if (!task) {
        throw new NotFoundException(`Task with ID ${id} not found`);
      }

      return await this.prisma.tasks.update({
        where: { id },
        data: taskData,
        include: {
          projects: true,
          assigned_user: {
            select: { id: true, first_name: true, last_name: true },
          },
        },
      });
    } catch (error) {
      console.error('Error updating task:', error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error('Failed to update task');
    }
  }

  async delete(id: number) {
    try {
      const task = await this.prisma.tasks.findUnique({ where: { id } });
      if (!task) {
        throw new NotFoundException(`Task with ID ${id} not found`);
      }

      return await this.prisma.tasks.update({
        where: { id },
        data: { active: false },
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error('Failed to delete task');
    }
  }

  async findByProject(projectId: number) {
    return this.prisma.tasks.findMany({
      where: { project_id: projectId, active: true },
      include: {
        assigned_user: {
          select: { id: true, first_name: true, last_name: true },
        },
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async findByUser(userId: number) {
    return this.prisma.tasks.findMany({
      where: {
        OR: [{ assigned_to: userId }, { created_by: userId }],
        active: true,
      },
      include: {
        projects: {
          select: { id: true, name: true },
        },
      },
      orderBy: { created_at: 'desc' },
    });
  }
}
