/**
 * ProjectsService encapsulates project CRUD with authorization and soft delete.
 * Rules:
 * - Owners have full access; members read-only.
 * - Non members cannot access (enforced in WHERE clauses).
 * - Soft delete via active flag.
 */

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

  /**
   * Retrieves all projects accessible to a user
   *
   * Authorization Logic:
   * - Users see projects they own (owner_id = userId)
   * - Users see projects they're members of (via project_members table)
   * - Only active projects are returned (soft delete pattern)
   *
   * Performance Optimizations:
   * - Uses select to limit returned fields
   * - Includes related data in single query to avoid N+1 problems
   * - Orders by creation date for consistent listing
   *
   * @param userId The authenticated user's ID
   * @returns Array of projects with client and member information
   */
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

  /**
   * Retrieves a single project with authorization check
   *
   * Security: Uses findFirst with WHERE conditions instead of findUnique
   * to ensure authorization is enforced at the database level.
   * This prevents unauthorized access even if someone guesses valid IDs.
   *
   * @param id Project ID to retrieve
   * @param userId Authenticated user's ID for authorization
   * @returns Project with full details or null if not found/unauthorized
   */
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

  /**
   * Creates a new project with automatic owner assignment
   *
   * Business Rules:
   * - Creating user automatically becomes the project owner
   * - Project is created as active by default
   * - Client association is optional (client_id can be null)
   *
   * Security:
   * - owner_id is set from authenticated user context, not from DTO
   * - This prevents privilege escalation where users could claim
   *   ownership of projects for other users
   *
   * Error Handling:
   * - Comprehensive try-catch for database constraint violations
   * - Specific error logging for debugging project creation issues
   *
   * @param data Project data from request body
   * @param owner_id Authenticated user ID (becomes project owner)
   * @returns Created project with client and member information
   */
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

  /**
   * Updates project data with strict ownership validation
   *
   * Authorization: Only project owners can update project details.
   * Project members have read-only access. This enforces a clear
   * hierarchy where only the person who created the project can
   * modify its core properties.
   *
   * Security Design:
   * - Pre-flight authorization check fails fast if user lacks permission
   * - Uses ForbiddenException for clear HTTP 403 response
   * - Validates ownership before attempting any data modifications
   *
   * @param id Project ID to update
   * @param data Fields to update
   * @param userId Authenticated user ID (must be project owner)
   * @returns Updated project data
   */
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

  /**
   * Implements soft delete pattern for data preservation
   *
   * Soft Delete Benefits:
   * - Preserves historical data for auditing
   * - Allows for "undo" functionality
   * - Maintains referential integrity with related records
   * - Supports analytics on deleted vs active projects
   *
   * Authorization: Only project owners can delete projects.
   * This prevents project members from accidentally or maliciously
   * removing projects they're working on.
   *
   * Security Design:
   * - Validates ownership before allowing deletion
   * - Uses ForbiddenException for clear HTTP 403 response
   * - Only allows deletion of active projects (prevents double-deletion)
   *
   * @param id Project ID to delete
   * @param userId Authenticated user ID (must be project owner)
   * @returns Updated project record with active = false
   */
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
