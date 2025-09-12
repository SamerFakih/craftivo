import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Injectable()
export class TasksService {
  constructor(private prisma: PrismaService) {}

  async findAllByUser(userId: number) {
    const tasks = await this.prisma.tasks.findMany({
      where: {
        OR: [{ created_by: userId }, { assigned_to: userId }],
      },
      include: {
        projects: {
          select: {
            name: true,
            clients: { select: { name: true } },
          },
        },
        assigned_user: {
          select: {
            first_name: true,
            last_name: true,
            profile_image: true,
          },
        },
        task_attachments: true,
        task_comments: true,
        task_tags: { select: { tag_name: true } },
      },
      orderBy: { created_at: 'desc' },
    });
    return tasks.map((t) => ({
      id: t.id,
      title: t.title,
      subtitle: t.description || '',
      project: t.projects?.name || '',
      client: t.projects?.clients?.name || '',
      dueISO: t.due_date ? t.due_date.toISOString() : null,
      assignee: {
        name: [t.assigned_user?.first_name, t.assigned_user?.last_name]
          .filter(Boolean)
          .join(' '),
        avatarUrl: t.assigned_user?.profile_image || '',
      },
      emailReminder: t.email_reminder || false,
      attachmentsCount: t.task_attachments?.length || 0,
      commentsCount: t.task_comments?.length || 0,
      tags: t.task_tags?.map((tag) => tag.tag_name) || [],
      status: t.status,
    }));
  }

  async findOne(id: number, userId: number) {
    const task = await this.prisma.tasks.findFirst({
      where: {
        id,
        OR: [{ created_by: userId }, { assigned_to: userId }],
        active: true,
      },
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
      throw new NotFoundException(
        `Task with ID ${id} not found or access denied`,
      );
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

  async update(id: number, data: UpdateTaskDto, userId: number) {
    try {
      const taskData = {
        ...data,
        due_date: data.due_date ? new Date(data.due_date) : undefined,
      };

      // Check if user has permission to update this task
      const task = await this.prisma.tasks.findFirst({
        where: {
          id,
          OR: [{ created_by: userId }, { assigned_to: userId }],
          active: true,
        },
      });

      if (!task) {
        throw new NotFoundException(
          `Task with ID ${id} not found or access denied`,
        );
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

  async delete(id: number, userId: number) {
    try {
      // Check if user has permission to delete this task (only creator can delete)
      const task = await this.prisma.tasks.findFirst({
        where: {
          id,
          created_by: userId, // Only creator can delete
          active: true,
        },
      });

      if (!task) {
        throw new NotFoundException(
          `Task with ID ${id} not found or insufficient permissions`,
        );
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
