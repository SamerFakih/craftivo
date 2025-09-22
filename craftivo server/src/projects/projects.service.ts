import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { parseDate } from '../common/utils/date.util';

// Narrow type for create/update payload accepted by Prisma
type MutableProjectFields = Pick<
  CreateProjectDto,
  | 'name'
  | 'description'
  | 'client_id'
  | 'status'
  | 'priority'
  | 'start_date'
  | 'end_date'
  | 'budget'
  | 'spent_amount'
  | 'progress'
  | 'hourly_rate'
  | 'currency'
  | 'billing_type'
  | 'active'
>;

interface CreatePayload
  extends Omit<MutableProjectFields, 'start_date' | 'end_date'> {
  start_date?: Date;
  end_date?: Date;
  owner_id: number;
}

interface UpdateAliases extends Partial<MutableProjectFields> {
  clientId?: number;
  startDate?: string;
  endDate?: string;
  spentAmount?: number;
  hourlyRate?: number;
  billingType?: string; // will be narrowed later
}

// Using shared parseDate utility (removed local implementation)

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: number) {
    return this.prisma.projects.findMany({
      where: {
        // Multi-level authorization check using Prisma's OR operator
        OR: [
          { owner_id: userId }, // User owns the project
          { project_members: { some: { user_id: userId } } }, // User is a member
        ],
        active: true, // Soft delete filter - only show active projects
      },
      // Include related data to minimize database round trips
      include: {
        clients: { select: { name: true } }, // Client info for project context
        project_members: {
          select: {
            users: {
              // Member information for project team display
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
      orderBy: { created_at: 'desc' }, // Most recent projects first
    });
  }

  async findOne(id: number, userId: number) {
    const project = await this.prisma.projects.findFirst({
      where: {
        id,
        // Same authorization logic as findAll
        OR: [
          { owner_id: userId },
          { project_members: { some: { user_id: userId } } },
        ],
        active: true, // Respect soft delete
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
    const { start_date, end_date, ...rest } = data;
    const payload: CreatePayload = {
      ...rest,
      owner_id,
      start_date: parseDate(start_date),
      end_date: parseDate(end_date),
    };

    try {
      return await this.prisma.projects.create({
        data: payload,
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
      // Swallow detailed DB error from leaking; log concise
      console.error('Create Project Error', error);
      throw new Error('Failed to create project');
    }
  }

  async update(id: number, data: UpdateProjectDto, userId: number) {
    // Check if user has permission to update - authorization first
    const project = await this.prisma.projects.findFirst({
      where: {
        id,
        owner_id: userId, // Strict ownership check - only owner can update
        active: true, // Cannot update soft-deleted projects
      },
    });

    if (!project) {
      throw new ForbiddenException('Not authorized to update this project');
    }

    // Convert incoming date strings to Date objects if present and map camelCase aliases
    const {
      start_date,
      end_date,
      clientId,
      startDate,
      endDate,
      spentAmount,
      hourlyRate,
      billingType,
      ...rest
    } = data as UpdateProjectDto & UpdateAliases;

    const updatePayload: Record<string, unknown> = { ...rest };
    if (clientId !== undefined && updatePayload.client_id === undefined)
      updatePayload.client_id = clientId;
    if (spentAmount !== undefined && updatePayload.spent_amount === undefined)
      updatePayload.spent_amount = spentAmount;
    if (hourlyRate !== undefined && updatePayload.hourly_rate === undefined)
      updatePayload.hourly_rate = hourlyRate;
    if (billingType !== undefined && updatePayload.billing_type === undefined)
      updatePayload.billing_type = billingType;

    const startRaw = startDate ?? start_date;
    const endRaw = endDate ?? end_date;
    const sd = parseDate(startRaw);
    const ed = parseDate(endRaw);
    if (sd) updatePayload.start_date = sd;
    if (ed) updatePayload.end_date = ed;

    return this.prisma.projects.update({
      where: { id },
      data: updatePayload,
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
    // Check if user has permission to delete - ownership verification
    const project = await this.prisma.projects.findFirst({
      where: {
        id,
        owner_id: userId, // Only project owner can delete
        active: true, // Can't delete already deleted projects
      },
    });

    if (!project) {
      throw new ForbiddenException('Not authorized to delete this project');
    }

    // Soft delete: Set active flag to false instead of removing record
    // This preserves all related data and relationships for auditing
    return this.prisma.projects.update({
      where: { id },
      data: { active: false }, // Mark as inactive rather than deleting
    });
  }
}
