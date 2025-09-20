import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTimeEntriesDto } from './dto/create-time-entries.dto';
import { UpdateTimeEntriesDto } from './dto/update-time-entries.dto';
import { TimeEntryStatus, Prisma } from '@prisma/client';
import {
  TimeEntriesSummaryQueryDto,
  TimeEntriesSummaryGroupBy,
  TimeEntriesProjectSummaryRow,
} from './dto/time-entries-summary-query.dto';

// List filter shape reused across queries
type ListFilters = {
  user_id?: number;
  project_id?: number;
  task_id?: number;
  status?: TimeEntryStatus;
  billable?: boolean;
  start_date?: string;
  end_date?: string;
};

@Injectable()
export class TimeEntriesService {
  constructor(private prisma: PrismaService) {}
  // Filter type reused across list endpoints
  private readonly baseListSelect = {
    users: { select: { id: true, first_name: true, last_name: true } },
    projects: {
      select: {
        id: true,
        name: true,
        clients: { select: { name: true, id: true } },
      },
    },
    tasks: { select: { id: true, title: true } },
  } as const;

  // Mapping utility removed; inline mapping used for stronger inference

  // Create time entry (computes duration if end_time provided)
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

  // List time entries (filtered)
  async findAll(filters?: ListFilters) {
    const where: Prisma.time_entriesWhereInput = {};
    if (filters?.user_id) where.user_id = filters.user_id;
    if (filters?.project_id) where.project_id = filters.project_id;
    if (filters?.task_id) where.task_id = filters.task_id;
    if (filters?.status) where.status = filters.status;
    if (filters?.billable !== undefined) where.billable = filters.billable;
    if (filters?.start_date || filters?.end_date) {
      where.start_time = {
        ...(filters.start_date && { gte: new Date(filters.start_date) }),
        ...(filters.end_date && { lte: new Date(filters.end_date) }),
      };
    }
    const entries = await this.prisma.time_entries.findMany({
      where,
      include: this.baseListSelect,
      orderBy: { start_time: 'desc' },
    });
    return entries.map((e) => ({
      id: `t${e.id}`,
      title: e.tasks?.title || '',
      project: e.projects?.name || '',
      client: e.projects?.clients?.name || '',
      note: e.description || '',
      dateISO: e.start_time ? e.start_time.toISOString().slice(0, 10) : '',
      startTime: e.start_time ? e.start_time.toISOString().slice(11, 16) : '',
      endTime: e.end_time ? e.end_time.toISOString().slice(11, 16) : '',
      hours: e.duration ? +(e.duration / 3600).toFixed(2) : 0,
      amountUSD: e.amount ? Number(e.amount) : 0,
      status: e.status,
    }));
  }

  // Get a single time entry (ownership enforced)
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

  // Update time entry (recomputes duration when applicable)
  async update(
    id: number,
    userId: number,
    updateTimeEntriesDto: UpdateTimeEntriesDto,
  ) {
    await this.findOne(id, userId);

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
  async remove(id: number, ctx: { user_id: number }) {
    await this.findOne(id, ctx.user_id); // ownership check
    return this.prisma.time_entries.delete({ where: { id } });
  }

  // Start running timer (ensures single active)
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

  // Stop running timer (finalize duration)
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

  // Entries by user
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

  // Entries by project
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

  // Billable entries (for invoicing)
  async findBillableEntries(filters?: {
    user_id?: number;
    project_id?: number;
    client_id?: number;
    start_date?: string;
    end_date?: string;
  }) {
    const where: Prisma.time_entriesWhereInput = {
      billable: true,
      status: { in: [TimeEntryStatus.logged, TimeEntryStatus.billed] },
    };

    if (filters?.user_id) where.user_id = filters.user_id;
    if (filters?.project_id) where.project_id = filters.project_id;

    if (filters?.start_date || filters?.end_date) {
      where.start_time = {
        ...(filters.start_date && { gte: new Date(filters.start_date) }),
        ...(filters.end_date && { lte: new Date(filters.end_date) }),
      };
    }

    if (filters?.client_id) {
      where.projects = { client_id: filters.client_id };
    }

    return this.prisma.time_entries.findMany({
      where,
      include: this.baseListSelect,
      orderBy: { start_time: 'desc' },
    });
  }

  // Aggregate usage stats
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

  // Summary aggregation (currently supports groupBy=project)
  async getSummary(
    userId: number,
    query: TimeEntriesSummaryQueryDto,
    filters?: { start_date?: string; end_date?: string },
  ): Promise<TimeEntriesProjectSummaryRow[]> {
    const groupBy: TimeEntriesSummaryGroupBy =
      query.groupBy || TimeEntriesSummaryGroupBy.PROJECT;
    // Base where clause scoped to user
    const where: Prisma.time_entriesWhereInput = { user_id: userId };
    if (filters?.start_date || filters?.end_date) {
      where.start_time = {
        ...(filters.start_date && { gte: new Date(filters.start_date) }),
        ...(filters.end_date && { lte: new Date(filters.end_date) }),
      };
    }

    // Fetch minimal fields to aggregate in memory (simpler for future groupBy extensions)
    const entries = await this.prisma.time_entries.findMany({
      where,
      select: {
        id: true,
        duration: true,
        amount: true,
        project_id: true,
        projects: { select: { id: true, name: true } },
      },
    });

    if (groupBy !== TimeEntriesSummaryGroupBy.PROJECT) {
      throw new BadRequestException('Unsupported groupBy value');
    }

    const map = new Map<number | null, TimeEntriesProjectSummaryRow>();
    for (const e of entries) {
      const key = e.project_id ?? null;
      let row = map.get(key);
      if (!row) {
        row = {
          project_id: key,
          project_name: e.projects?.name ?? null,
          entry_count: 0,
          total_duration_seconds: 0,
          total_hours: 0,
          total_amount: 0,
        };
        map.set(key, row);
      }
      row.entry_count += 1;
      row.total_duration_seconds += e.duration || 0;
      row.total_amount += Number(e.amount) || 0;
    }
    const rows: TimeEntriesProjectSummaryRow[] = Array.from(map.values()).map(
      (r) => ({
        ...r,
        total_hours: +(r.total_duration_seconds / 3600).toFixed(2),
      }),
    );
    rows.sort((a, b) => b.total_duration_seconds - a.total_duration_seconds);
    return rows;
  }

  // KPI metrics (today, week, month) for current user
  async getKpis(userId: number) {
    const now = new Date();
    const startOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    const dayOfWeek = now.getDay(); // 0=Sun
    const startOfWeek = new Date(
      startOfDay.getTime() - dayOfWeek * 24 * 60 * 60 * 1000,
    );
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Fetch entries since start of month (covers all windows)
    const entries = await this.prisma.time_entries.findMany({
      where: {
        user_id: userId,
        start_time: { gte: startOfMonth },
      },
      select: {
        id: true,
        start_time: true,
        duration: true,
        status: true,
      },
      orderBy: { start_time: 'desc' },
    });

    let todaySeconds = 0;
    let weekSeconds = 0;
    let monthSeconds = 0;
    const billableSeconds = 0; // placeholder if we later add billable info here
    let runningEntryId: number | null = null;
    let lastEntryStartedAt: Date | null = null;

    for (const e of entries) {
      const start = e.start_time;
      const dur = e.duration || 0;
      if (!lastEntryStartedAt) lastEntryStartedAt = start;
      if (start >= startOfMonth) monthSeconds += dur;
      if (start >= startOfWeek) weekSeconds += dur;
      if (start >= startOfDay) todaySeconds += dur;
      if (e.status === TimeEntryStatus.running && !runningEntryId) {
        runningEntryId = e.id;
      }
    }

    return {
      today_seconds: todaySeconds,
      week_seconds: weekSeconds,
      month_seconds: monthSeconds,
      today_hours: +(todaySeconds / 3600).toFixed(2),
      week_hours: +(weekSeconds / 3600).toFixed(2),
      month_hours: +(monthSeconds / 3600).toFixed(2),
      billable_seconds: billableSeconds,
      billable_hours: +(billableSeconds / 3600).toFixed(2),
      running_entry_id: runningEntryId,
      last_entry_started_at: lastEntryStartedAt,
      generated_at: now,
    };
  }

  // Export filtered entries to CSV
  async exportCsv(filters: ListFilters & { user_id: number }) {
    const where: Prisma.time_entriesWhereInput = { user_id: filters.user_id };
    if (filters.project_id) where.project_id = filters.project_id;
    if (filters.task_id) where.task_id = filters.task_id;
    if (filters.status) where.status = filters.status;
    if (filters.billable !== undefined) where.billable = filters.billable;
    if (filters.start_date || filters.end_date) {
      where.start_time = {
        ...(filters.start_date && { gte: new Date(filters.start_date) }),
        ...(filters.end_date && { lte: new Date(filters.end_date) }),
      };
    }

    const entries = await this.prisma.time_entries.findMany({
      where,
      include: {
        projects: { select: { id: true, name: true } },
        tasks: { select: { id: true, title: true } },
      },
      orderBy: { start_time: 'desc' },
    });

    const header = [
      'id',
      'date',
      'start_time',
      'end_time',
      'duration_hours',
      'project',
      'task',
      'client',
      'billable',
      'amount',
      'status',
      'note',
    ];

    const rows = entries.map((e) => {
      const durationHours = e.duration ? (e.duration / 3600).toFixed(2) : '0';
      const dateISO = e.start_time ? e.start_time.toISOString() : '';
      const date = dateISO.slice(0, 10);
      const startTime = e.start_time ? dateISO.slice(11, 19) : '';
      const endTime = e.end_time ? e.end_time.toISOString().slice(11, 19) : '';
      const project = e.projects?.name || '';
      const task = e.tasks?.title || '';
      const client = ''; // placeholder unless we join client
      const note = e.description || '';
      const cols = [
        e.id,
        date,
        startTime,
        endTime,
        durationHours,
        project,
        task,
        client,
        e.billable ? 'true' : 'false',
        e.amount ? Number(e.amount).toString() : '0',
        e.status,
        note,
      ];
      return cols.map((c) => csvEscape(String(c))).join(',');
    });

    function csvEscape(value: string) {
      if (value.includes('"')) value = value.replace(/"/g, '""');
      if (/[",\n]/.test(value)) return `"${value}"`;
      return value;
    }

    return [header.join(','), ...rows].join('\n');
  }
}
