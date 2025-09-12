/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OverviewService {
  constructor(private prisma: PrismaService) {}

  async getOverview(userId: number) {
    // Total Revenue (paid invoices)
    const totalRevenue = await this.prisma.invoices.aggregate({
      _sum: { total_amount: true },
      where: { user_id: userId, status: 'paid' },
    });

    // Active Projects
    const activeProjects = await this.prisma.projects.count({
      where: { owner_id: userId, status: 'active' },
    });

    // Hours This Month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const hoursThisMonth = await this.prisma.time_entries.aggregate({
      _sum: { duration: true },
      where: {
        user_id: userId,
        start_time: { gte: startOfMonth },
      },
    });

    // Team Members (all users in teams owned by this user)
    const teamMembers = await this.prisma.team_members.findMany({
      where: { teams: { owner_id: userId } },
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
    });

    // Recent Projects
    const recentProjects = await this.prisma.projects.findMany({
      where: { owner_id: userId },
      orderBy: { created_at: 'desc' },
      take: 3,
      select: {
        id: true,
        name: true,
        progress: true,
        created_at: true,
        clients: { select: { id: true, name: true } },
        budget: true,
        end_date: true,
      },
    });

    // Today's Tasks (assigned to user, created today)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const todayTasks = await this.prisma.tasks.findMany({
      where: {
        assigned_to: userId,
        created_at: { gte: today, lt: tomorrow },
      },
      select: {
        id: true,
        title: true,
        projects: { select: { name: true } },
        due_time: true,
        status: true,
      },
    });

    // Team Activity (last 10 activities by team members)
    const teamActivity = await this.prisma.activity_logs.findMany({
      where: {
        users: {
          team_members: { some: { teams: { owner_id: userId } } },
        },
      },
      orderBy: { created_at: 'desc' },
      take: 10,
      select: {
        action: true,
        created_at: true,
        users: { select: { first_name: true, last_name: true } },
      },
    });

    return {
      totalRevenue: totalRevenue._sum.total_amount
        ? typeof totalRevenue._sum.total_amount === 'object' &&
          'toNumber' in totalRevenue._sum.total_amount
          ? totalRevenue._sum.total_amount.toNumber()
          : totalRevenue._sum.total_amount
        : 0,
      activeProjects,
      hoursThisMonth: hoursThisMonth._sum.duration
        ? typeof hoursThisMonth._sum.duration === 'object' &&
          typeof (hoursThisMonth._sum.duration as any).toNumber === 'function'
          ? (hoursThisMonth._sum.duration as any).toNumber() / 3600
          : Number(hoursThisMonth._sum.duration) / 3600
        : 0,
      teamMembers: teamMembers.map((m) => ({
        id: m.users.id,
        name: `${m.users.first_name} ${m.users.last_name}`,
        avatar: m.users.profile_image,
      })),
      recentProjects: recentProjects.map((p) => ({
        id: p.id,
        name: p.name,
        progress: p.progress,
        createdAt: p.created_at,
        client: p.clients ? { id: p.clients.id, name: p.clients.name } : null,
        budget: p.budget,
        endDate: p.end_date,
      })),
      todayTasks,
      teamActivity: teamActivity.map((a) => ({
        action: a.action,
        timestamp: a.created_at,
        user: a.users
          ? `${a.users.first_name} ${a.users.last_name}`
          : 'Unknown',
      })),
    };
  }
}
