// TeamsService: manages teams, members, roles, slugs, and basic stats.
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { AddTeamMemberDto } from './dto/add-team-member.dto';
import { Prisma, TeamRole } from '@prisma/client';

@Injectable()
export class TeamsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Aggregates team members across all teams for dashboard view
   *
   * Complex Business Logic:
   * - Finds all teams where user is owner or member
   * - Flattens member lists from multiple teams
   * - Deduplicates users who appear in multiple teams
   * - Transforms database user records into dashboard-friendly format
   *
   * Performance Considerations:
   * - Uses Map for O(1) deduplication instead of array filtering
   * - Single query with includes to avoid N+1 problems
   * - Returns computed dashboard metrics (placeholder values for now)
   *
   * @param userId Authenticated user ID
   * @returns Deduplicated list of all team members across user's teams
   */
  // Get all team members for the current user (owner or member)
  async getMembers(userId: number): Promise<any[]> {
    // Find all teams the user is part of - ownership OR membership
    const teams = await this.prisma.teams.findMany({
      where: {
        OR: [
          { owner_id: userId }, // Teams user owns
          { team_members: { some: { user_id: userId } } }, // Teams user is member of
        ],
        active: true, // Only active teams
      },
      include: {
        team_members: {
          include: {
            users: true, // Full user data for member aggregation
          },
        },
      },
    });

    // Flatten all members from all teams, deduplicate by user ID
    // Also accumulate team names per user for label
    const memberMap: Map<
      number,
      {
        data: any;
        teams: Set<string>;
      }
    > = new Map();

    for (const t of teams) {
      const teamName = t.name;
      for (const tm of t.team_members) {
        const u = tm.users;
        if (!u) continue;
        const existing = memberMap.get(u.id);
        const base = {
          id: `m${u.id}`,
          name: `${u.first_name} ${u.last_name}`.trim() || u.email,
          title: tm.role || 'member',
          status: u.active ? 'active' : 'inactive',
          email: u.email,
          location: u.location || '',
          avatarUrl: u.profile_image || '',
          hourlyRateUSD: u.hourly_rate ? Number(u.hourly_rate) : 0,
          hoursMonth: 0,
          activeProjects: 0,
          tasksDone: 0,
          skills: [],
          team: teamName,
        };
        if (!existing) {
          memberMap.set(u.id, { data: base, teams: new Set([teamName]) });
        } else {
          existing.teams.add(teamName);
        }
      }
    }

    const userIds = Array.from(memberMap.keys());
    if (userIds.length === 0) return [];

    // Compute start of current month for hours aggregation
    const now = new Date();
    const startOfMonth = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0),
    );

    // Aggregate metrics in parallel
    const [projectMemberRows, taskDoneRows, timeAggRows] = await Promise.all([
      this.prisma.project_members.findMany({
        where: {
          user_id: { in: userIds },
          projects: { active: true },
        },
        select: { user_id: true },
      }),
      this.prisma.tasks.groupBy({
        by: ['assigned_to'],
        where: {
          assigned_to: { in: userIds },
          status: 'completed',
        },
        _count: { _all: true },
      }),
      this.prisma.time_entries.groupBy({
        by: ['user_id'],
        where: {
          user_id: { in: userIds },
          start_time: { gte: startOfMonth },
          duration: { not: null },
        },
        _sum: { duration: true },
      }),
    ]);

    // Reduce aggregations into maps for quick lookup
    const activeProjectsMap = new Map<number, number>();
    for (const row of projectMemberRows) {
      activeProjectsMap.set(
        row.user_id,
        (activeProjectsMap.get(row.user_id) || 0) + 1,
      );
    }

    const tasksDoneMap = new Map<number, number>();
    for (const row of taskDoneRows) {
      const uid = row.assigned_to;
      if (uid != null) tasksDoneMap.set(uid, row._count._all);
    }

    const hoursMonthMap = new Map<number, number>();
    for (const row of timeAggRows) {
      const totalSeconds = Number(row._sum.duration || 0);
      const hours = totalSeconds / 3600;
      hoursMonthMap.set(row.user_id, Math.round(hours * 10) / 10);
    }

    // Build final array and set team label (single team name or 'Multiple')
    const result = [] as any[];
    for (const [uid, { data, teams: teamNames }] of memberMap) {
      const names = Array.from(teamNames);
      let teamLabel = '';
      if (names.length <= 1) {
        teamLabel = names[0] || '';
      } else {
        teamLabel = 'Multiple';
      }
      result.push({
        ...data,
        team: teamLabel,
        activeProjects: activeProjectsMap.get(uid) || 0,
        tasksDone: tasksDoneMap.get(uid) || 0,
        hoursMonth: hoursMonthMap.get(uid) || 0,
      });
    }

    return result;
  }

  /**
   * Creates a new team with automatic slug generation and ownership assignment
   *
   * Business Logic:
   * - Auto-generates URL-friendly slug if not provided
   * - Validates slug uniqueness across all teams
   * - Sets creating user as team owner automatically
   * - Initializes team settings with defaults
   *
   * Slug Generation Strategy:
   * - Converts team name to lowercase, URL-safe format
   * - Replaces spaces and special characters with hyphens
   * - Ensures slugs are unique for team identification
   *
   * Security:
   * - Owner ID comes from authenticated user, not request body
   * - Prevents users from creating teams with arbitrary ownership
   *
   * @param createTeamDto Team data from request
   * @param userId Authenticated user ID (becomes team owner)
   * @returns Created team with owner and member information
   */
  async create(createTeamDto: CreateTeamDto, userId: number) {
    const slug = createTeamDto.slug;
    const rawSettings: unknown = createTeamDto.settings;
    const teamData = {
      name: createTeamDto.name,
      description: createTeamDto.description,
    };

    // Generate slug if not provided - auto-creates URL-friendly identifier
    const finalSlug = slug || this.generateSlug(createTeamDto.name);

    // Validate slug uniqueness - prevents duplicate team identifiers
    const existingTeam = await this.prisma.teams.findUnique({
      where: { slug: finalSlug },
    });

    if (existingTeam) {
      throw new Error(`Team with slug '${finalSlug}' already exists`);
    }

    return this.prisma.teams.create({
      data: {
        ...teamData,
        slug: finalSlug,
        settings: this.sanitizeJson(rawSettings ?? {}),
        owner_id: userId, // Force ownership to authenticated user
      },
      include: {
        users: true, // Team owner information
        team_members: {
          include: {
            users: {
              select: {
                // Optimized user data for team member display
                id: true,
                first_name: true,
                last_name: true,
                email: true,
                profile_image: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Retrieves all teams accessible to a user with member statistics
   *
   * Authorization: Users can see teams they own or are members of.
   * This implements a multi-team access pattern where users can
   * participate in multiple teams with different roles.
   *
   * Performance Optimizations:
   * - Single query with nested includes to avoid N+1 problems
   * - Uses _count for efficient member counting
   * - Optimized select statements to minimize data transfer
   *
   * Team Statistics:
   * - Includes member count for dashboard display
   * - Orders by creation date for consistent listing
   * - Returns owner and member information for team cards
   *
   * @param userId Authenticated user ID
   * @returns Teams with member info and statistics
   */
  async findAll(userId: number) {
    return this.prisma.teams.findMany({
      where: {
        OR: [
          { owner_id: userId }, // Teams user owns
          { team_members: { some: { user_id: userId } } }, // Teams user is member of
        ],
        active: true, // Only active teams
      },
      include: {
        users: {
          // Team owner information
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
            profile_image: true,
          },
        },
        team_members: {
          include: {
            users: {
              select: {
                // Team member information for team cards
                id: true,
                first_name: true,
                last_name: true,
                email: true,
                profile_image: true,
              },
            },
          },
        },
        _count: {
          select: {
            team_members: true, // Efficient member count for statistics
          },
        },
      },
      orderBy: { created_at: 'desc' }, // Most recent teams first
    });
  }

  async findOne(id: number, userId: number) {
    const team = await this.prisma.teams.findFirst({
      where: {
        id,
        OR: [
          { owner_id: userId },
          { team_members: { some: { user_id: userId } } },
        ],
        active: true,
      },
      include: {
        users: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
            profile_image: true,
          },
        },
        team_members: {
          include: {
            users: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
                email: true,
                profile_image: true,
                hourly_rate: true,
              },
            },
          },
          orderBy: { joined_at: 'asc' },
        },
      },
    });

    if (!team) {
      throw new Error('Team not found or access denied');
    }

    return team;
  }

  async update(id: number, updateTeamDto: UpdateTeamDto, userId: number) {
    // Check if user is team owner
    const team = await this.prisma.teams.findFirst({
      where: { id, owner_id: userId, active: true },
    });

    if (!team) {
      throw new Error('Team not found or insufficient permissions');
    }

    const slug = updateTeamDto.slug;
    const rawSettings: unknown = updateTeamDto.settings;
    const updateData: Partial<{ name: string; description: string }> = {};
    if (updateTeamDto.name !== undefined) updateData.name = updateTeamDto.name;
    if (updateTeamDto.description !== undefined)
      updateData.description = updateTeamDto.description;

    // Check slug uniqueness if provided
    if (slug && slug !== team.slug) {
      const existingTeam = await this.prisma.teams.findUnique({
        where: { slug },
      });

      if (existingTeam) {
        throw new Error(`Team with slug '${slug}' already exists`);
      }
    }

    return this.prisma.teams.update({
      where: { id },
      data: {
        ...updateData,
        ...(slug && { slug }),
        ...(rawSettings !== undefined && {
          settings: this.sanitizeJson(rawSettings),
        }),
      },
      include: {
        users: true,
        team_members: {
          include: {
            users: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
                email: true,
                profile_image: true,
              },
            },
          },
        },
      },
    });
  }

  async remove(id: number, userId: number) {
    // Check if user is team owner
    const team = await this.prisma.teams.findFirst({
      where: { id, owner_id: userId, active: true },
    });

    if (!team) {
      throw new Error('Team not found or insufficient permissions');
    }

    return this.prisma.teams.update({
      where: { id },
      data: { active: false },
    });
  }

  async addMember(
    teamId: number,
    addMemberDto: AddTeamMemberDto,
    userId: number,
  ) {
    // Check if user can add members (owner or admin)
    const team = await this.prisma.teams.findFirst({
      where: {
        id: teamId,
        OR: [
          { owner_id: userId },
          {
            team_members: {
              some: {
                user_id: userId,
                role: { in: ['owner', 'admin'] },
              },
            },
          },
        ],
        active: true,
      },
    });

    if (!team) {
      throw new Error('Team not found or insufficient permissions');
    }

    // Check if user exists
    const userExists = await this.prisma.users.findUnique({
      where: { id: addMemberDto.user_id },
    });

    if (!userExists) {
      throw new Error('User not found');
    }

    // Check if user is already a member
    const existingMember = await this.prisma.team_members.findUnique({
      where: {
        team_id_user_id: {
          team_id: teamId,
          user_id: addMemberDto.user_id,
        },
      },
    });

    if (existingMember) {
      throw new Error('User is already a team member');
    }

    const rawPermissions: unknown = addMemberDto.permissions;

    return this.prisma.team_members.create({
      data: {
        team_id: teamId,
        user_id: addMemberDto.user_id,
        role: addMemberDto.role ?? TeamRole.member,
        hourly_rate: addMemberDto.hourly_rate,
        permissions: this.sanitizeJson(rawPermissions ?? {}),
      },
      include: {
        users: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
            profile_image: true,
          },
        },
      },
    });
  }

  async removeMember(teamId: number, memberId: number, userId: number) {
    // Check if user can remove members (owner or admin)
    const team = await this.prisma.teams.findFirst({
      where: {
        id: teamId,
        OR: [
          { owner_id: userId },
          {
            team_members: {
              some: {
                user_id: userId,
                role: { in: ['owner', 'admin'] },
              },
            },
          },
        ],
        active: true,
      },
    });

    if (!team) {
      throw new Error('Team not found or insufficient permissions');
    }

    // Check if member exists
    const member = await this.prisma.team_members.findUnique({
      where: {
        team_id_user_id: {
          team_id: teamId,
          user_id: memberId,
        },
      },
    });

    if (!member) {
      throw new Error('Team member not found');
    }

    // Don't allow removing the team owner
    if (team.owner_id === memberId) {
      throw new Error('Cannot remove team owner');
    }

    return this.prisma.team_members.delete({
      where: {
        team_id_user_id: {
          team_id: teamId,
          user_id: memberId,
        },
      },
    });
  }

  async updateMemberRole(
    teamId: number,
    memberId: number,
    role: TeamRole,
    userId: number,
  ) {
    // Check if user can update member roles (owner or admin)
    const team = await this.prisma.teams.findFirst({
      where: {
        id: teamId,
        OR: [
          { owner_id: userId },
          {
            team_members: {
              some: {
                user_id: userId,
                role: { in: ['owner', 'admin'] },
              },
            },
          },
        ],
        active: true,
      },
    });

    if (!team) {
      throw new Error('Team not found or insufficient permissions');
    }

    // Check if member exists
    const member = await this.prisma.team_members.findUnique({
      where: {
        team_id_user_id: {
          team_id: teamId,
          user_id: memberId,
        },
      },
    });

    if (!member) {
      throw new Error('Team member not found');
    }

    // Don't allow changing the team owner's role
    if (team.owner_id === memberId) {
      throw new Error('Cannot change team owner role');
    }

    return this.prisma.team_members.update({
      where: {
        team_id_user_id: {
          team_id: teamId,
          user_id: memberId,
        },
      },
      data: { role },
      include: {
        users: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
            profile_image: true,
          },
        },
      },
    });
  }

  async getTeamMembers(teamId: number, userId: number) {
    // Check if user has access to team
    const team = await this.prisma.teams.findFirst({
      where: {
        id: teamId,
        OR: [
          { owner_id: userId },
          { team_members: { some: { user_id: userId } } },
        ],
        active: true,
      },
    });

    if (!team) {
      throw new Error('Team not found or access denied');
    }

    return this.prisma.team_members.findMany({
      where: { team_id: teamId },
      include: {
        users: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
            profile_image: true,
            hourly_rate: true,
          },
        },
      },
      orderBy: { joined_at: 'asc' },
    });
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  private sanitizeJson(value: unknown): Prisma.InputJsonValue {
    if (
      value === null ||
      ['string', 'number', 'boolean'].includes(typeof value)
    ) {
      return value as Prisma.InputJsonValue;
    }
    if (Array.isArray(value)) {
      return value.map((v) =>
        this.sanitizeJson(v),
      ) as unknown as Prisma.InputJsonArray;
    }
    if (typeof value === 'object') {
      const obj: Record<string, Prisma.InputJsonValue> = {};
      for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
        obj[k] = this.sanitizeJson(v);
      }
      return obj;
    }
    return {};
  }
}
