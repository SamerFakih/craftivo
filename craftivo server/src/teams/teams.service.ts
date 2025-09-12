/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { AddTeamMemberDto } from './dto/add-team-member.dto';
import { TeamRole } from '@prisma/client';

@Injectable()
export class TeamsService {
  constructor(private prisma: PrismaService) {}

  // Get all team members for the current user (owner or member)
  async getMembers(userId: number): Promise<any[]> {
    // Find all teams the user is part of
    const teams = await this.prisma.teams.findMany({
      where: {
        OR: [
          { owner_id: userId },
          { team_members: { some: { user_id: userId } } },
        ],
        active: true,
      },
      include: {
        team_members: {
          include: {
            users: true,
          },
        },
      },
    });

    // Flatten all members from all teams, deduplicate by user id
    const memberMap = new Map();
    for (const team of teams) {
      for (const tm of team.team_members) {
        const u = tm.users;
        if (!memberMap.has(u.id)) {
          memberMap.set(u.id, {
            id: `m${u.id}`,
            name: `${u.first_name} ${u.last_name}`.trim(),
            title: u.role || '',
            status: u.active ? 'active' : 'inactive',
            email: u.email,
            location: u.location || '',
            avatarUrl: u.profile_image || '',
            hourlyRateUSD: u.hourly_rate ? Number(u.hourly_rate) : 0,
            hoursMonth: 0, // Placeholder, needs aggregation
            activeProjects: 0, // Placeholder, needs aggregation
            tasksDone: 0, // Placeholder, needs aggregation
            skills: [], // Placeholder, needs aggregation
          });
        }
      }
    }
    return Array.from(memberMap.values());
  }

  async create(createTeamDto: CreateTeamDto, userId: number) {
    const { slug, settings, ...teamData } = createTeamDto;

    // Generate slug if not provided
    const finalSlug = slug || this.generateSlug(createTeamDto.name);

    // Check if slug is unique
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
        settings: settings || {},
        owner_id: userId,
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

  async findAll(userId: number) {
    return this.prisma.teams.findMany({
      where: {
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
              },
            },
          },
        },
        _count: {
          select: {
            team_members: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
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

    const { slug, settings, ...teamData } = updateTeamDto;

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
        ...teamData,
        ...(slug && { slug }),
        ...(settings && { settings }),
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

    const { permissions, ...memberData } = addMemberDto;

    return this.prisma.team_members.create({
      data: {
        team_id: teamId,
        ...memberData,
        permissions: permissions || {},
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
}
