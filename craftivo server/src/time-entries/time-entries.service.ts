/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateTimeEntriesDto } from './dto/create-time-entries.dto';
import { UpdateTimeEntriesDto } from './dto/update-time-entries.dto';
import { TimeEntryStatus } from '@prisma/client';

@Injectable()
export class TimeEntriesService {
  constructor(private prisma: PrismaService) {}

  // Create a new time entry
  async create(createTimeEntriesDto: CreateTimeEntriesDto) {
    const {
      user_id,
      project_id,
      task_id,
      start_time,
      end_time,
      duration,
      ...rest
    } = createTimeEntriesDto;

    // Validate user exists
    const user = await this.prisma.users.findUnique({ where: { id: user_id } });
    if (!user) throw new NotFoundException('User not found');

    // Validate project exists
    const project = await this.prisma.projects.findUnique({
      where: { id: project_id },
    });
    if (!project) throw new NotFoundException('Project not found');

    // Validate task exists if provided
    if (task_id) {
      const task = await this.prisma.tasks.findUnique({
        where: { id: task_id },
      });
      if (!task) throw new NotFoundException('Task not found');
    }

    // Calculate duration if end_time is provided but duration is not
    let calculatedDuration = duration;
    if (end_time && !duration) {
      const startTime = new Date(start_time);
      const endTime = new Date(end_time);
      calculatedDuration = Math.floor(
        (endTime.getTime() - startTime.getTime()) / 1000,
      );
    }

    return this.prisma.time_entries.create({
      data: {
        user_id,
        project_id,
        task_id,
        start_time: new Date(start_time),
        end_time: end_time ? new Date(end_time) : null,
        duration: calculatedDuration,
        ...rest,
      },
      include: {
        users: { select: { id: true, first_name: true, last_name: true } },
        projects: { select: { id: true, name: true } },
        tasks: { select: { id: true, title: true } },
      },
    });
  }

  // Get all time entries with filters
  async findAll(filters?: {
    user_id?: number;
    project_id?: number;
    task_id?: number;
    status?: TimeEntryStatus;
    billable?: boolean;
    start_date?: string;
    end_date?: string;
  }) {
    const where: any = {};

    if (filters?.user_id) where.user_id = filters.user_id;
    if (filters?.project_id) where.project_id = filters.project_id;
    if (filters?.task_id) where.task_id = filters.task_id;
    if (filters?.status) where.status = filters.status;
    if (filters?.billable !== undefined) where.billable = filters.billable;

    if (filters?.start_date || filters?.end_date) {
      where.start_time = {};
      if (filters.start_date)
        where.start_time.gte = new Date(filters.start_date);
      if (filters.end_date) where.start_time.lte = new Date(filters.end_date);
    }

    return this.prisma.time_entries.findMany({
      where,
      include: {
        users: { select: { id: true, first_name: true, last_name: true } },
        projects: { select: { id: true, name: true } },
        tasks: { select: { id: true, title: true } },
      },
      orderBy: { start_time: 'desc' },
    });
  }

  // Get a single time entry by ID
  async findOne(id: number, userId: number) {
    const timeEntry = await this.prisma.time_entries.findUnique({
      where: { id },
      include: {
        users: { select: { id: true, first_name: true, last_name: true } },
        projects: { select: { id: true, name: true } },
        tasks: { select: { id: true, title: true } },
        invoice_items: true,
      },
    });

    if (!timeEntry) {
      throw new NotFoundException('Time entry not found');
    }

    // Optional: check if the user owns the entry
    if (timeEntry.user_id !== userId) {
      throw new NotFoundException('Time entry not found');
    }

    return timeEntry;
  }

  // Update a time entry
  async update(
    id: number,
    userId: number,
    updateTimeEntriesDto: UpdateTimeEntriesDto,
  ) {
    const timeEntry = await this.findOne(id, userId);

    const { start_time, end_time, duration, ...rest } = updateTimeEntriesDto;

    // Calculate duration if end_time is provided but duration is not
    let calculatedDuration = duration;
    if (end_time && !duration && start_time) {
      const startTime = new Date(start_time);
      const endTime = new Date(end_time);
      calculatedDuration = Math.floor(
        (endTime.getTime() - startTime.getTime()) / 1000,
      );
    }

    return this.prisma.time_entries.update({
      where: { id },
      data: {
        start_time: start_time ? new Date(start_time) : undefined,
        end_time: end_time ? new Date(end_time) : undefined,
        duration: calculatedDuration,
        ...rest,
      },
      include: {
        users: { select: { id: true, first_name: true, last_name: true } },
        projects: { select: { id: true, name: true } },
        tasks: { select: { id: true, title: true } },
      },
    });
  }

  // Delete a time entry
  async remove(id: number, p0: { user_id: any }) {
    await this.findOne(id, p0.user_id); // Check if exists
    return this.prisma.time_entries.delete({ where: { id } });
  }

  // Start a timer (create running entry)
  async startTimer(createTimeEntriesDto: Omit<CreateTimeEntriesDto, 'status'>) {
    // Check if user has any running timers
    const runningEntry = await this.prisma.time_entries.findFirst({
      where: {
        user_id: createTimeEntriesDto.user_id,
        status: TimeEntryStatus.running,
      },
    });

    if (runningEntry) {
      throw new BadRequestException('User already has a running timer');
    }

    return this.create({
      ...createTimeEntriesDto,
      status: TimeEntryStatus.running,
    });
  }

  // Stop a running timer
  async stopTimer(id: number, userId: number) {
    const timeEntry = await this.findOne(id, userId);

    if (timeEntry.status !== TimeEntryStatus.running) {
      throw new BadRequestException('Time entry is not running');
    }

    const endTime = new Date();
    const duration = Math.floor(
      (endTime.getTime() - timeEntry.start_time.getTime()) / 1000,
    );

    return this.prisma.time_entries.update({
      where: { id },
      data: {
        end_time: endTime,
        duration,
        status: TimeEntryStatus.logged,
      },
      include: {
        users: { select: { id: true, first_name: true, last_name: true } },
        projects: { select: { id: true, name: true } },
        tasks: { select: { id: true, title: true } },
      },
    });
  }

  // Get time entries by user
  async findByUser(
    userId: number,
    filters?: {
      project_id?: number;
      status?: TimeEntryStatus;
      start_date?: string;
      end_date?: string;
    },
  ) {
    return this.findAll({ ...filters, user_id: userId });
  }

  // Get time entries by project
  async findByProject(
    projectId: number,
    filters?: {
      user_id?: number;
      status?: TimeEntryStatus;
      start_date?: string;
      end_date?: string;
    },
  ) {
    return this.findAll({ ...filters, project_id: projectId });
  }

  // Get billable time entries for invoicing
  async findBillableEntries(filters?: {
    user_id?: number;
    project_id?: number;
    client_id?: number;
    start_date?: string;
    end_date?: string;
  }) {
    const where: any = {
      billable: true,
      status: { in: [TimeEntryStatus.logged, TimeEntryStatus.billed] },
    };

    if (filters?.user_id) where.user_id = filters.user_id;
    if (filters?.project_id) where.project_id = filters.project_id;

    if (filters?.start_date || filters?.end_date) {
      where.start_time = {};
      if (filters.start_date)
        where.start_time.gte = new Date(filters.start_date);
      if (filters.end_date) where.start_time.lte = new Date(filters.end_date);
    }

    if (filters?.client_id) {
      where.projects = { client_id: filters.client_id };
    }

    return this.prisma.time_entries.findMany({
      where,
      include: {
        users: { select: { id: true, first_name: true, last_name: true } },
        projects: {
          select: {
            id: true,
            name: true,
            client_id: true,
            clients: { select: { id: true, name: true } },
          },
        },
        tasks: { select: { id: true, title: true } },
      },
      orderBy: { start_time: 'desc' },
    });
  }

  // Get time tracking statistics
  async getTimeStats(userId: number, period?: 'day' | 'week' | 'month') {
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'day':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), 0, 1); // Year start
    }

    const stats = await this.prisma.time_entries.aggregate({
      where: {
        user_id: userId,
        start_time: { gte: startDate },
      },
      _sum: { duration: true, amount: true },
      _count: { id: true },
    });

    return {
      total_entries: stats._count.id || 0,
      total_duration: stats._sum.duration || 0,
      total_amount: stats._sum.amount || 0,
      period,
      start_date: startDate,
      end_date: now,
    };
  }
}
