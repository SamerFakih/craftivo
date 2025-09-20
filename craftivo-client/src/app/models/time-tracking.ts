export interface TimeEntry {
  id: string;
  title: string; // e.g., "Homepage wireframes"
  project: string; // "E-commerce Redesign"
  client: string; // "TechCorp Inc."
  note?: string; // "Created detailed wireframes..."
  dateISO: string; // "2024-08-25"
  startTime: string; // "09:00"
  endTime: string; // "12:30"
  hours: number; // 3.5
  amountUSD: number; // 297.5
  status: 'completed' | 'running';
}

// Payloads sent to backend (create/update). Server may compute hours or amount if omitted.
export interface CreateTimeEntryDto {
  title: string;
  project: string;
  client: string;
  dateISO: string;
  startTime?: string;
  endTime?: string;
  hours?: number;
  amountUSD?: number;
  note?: string;
  status?: 'completed' | 'running';
}

export interface UpdateTimeEntryDto extends Partial<CreateTimeEntryDto> {}

// Query parameters shape used by listing methods on service
export interface TimeEntryQuery {
  project?: string; // single project filter
  status?: 'completed' | 'running';
  dateFrom?: string; // YYYY-MM-DD
  dateTo?: string; // YYYY-MM-DD
  page?: number;
  pageSize?: number;
  search?: string;
}

export interface PaginatedTimeEntries {
  data: TimeEntry[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// KPI summary for period (today / week etc.)
export interface KpiSummary {
  totalHours: number;
  totalRevenue: number;
  entriesCount: number;
  usersCount?: number;
  byDay?: { dateISO: string; hours: number; revenue: number }[];
  period: { from: string; to: string };
}

// Project aggregate summary
export interface ProjectAggregate {
  project: string;
  client: string;
  totalHours: number;
  revenueUSD: number;
  recent?: { id: string; title: string; hours: number; dateISO: string }[];
}

export interface ProjectAggregateResponse {
  data: ProjectAggregate[];
}
export interface KpiSummaryResponse {
  data: KpiSummary;
}

export interface MemberSummary {
  name: string; // "You"
  todayHours: number; // 11.5h
  weekHours: number; // 42.5h
  totalHours: number; // 120.4h
  revenueUSD: number; // 1572.5
  progressPct: number; // 0..100
}

export interface ProjectHoursCard {
  project: string;
  client: string;
  totalHours: number;
  revenueUSD: number;
  recent: { label: string; hours: number }[]; // e.g., [{label:'Homepage wireframes', hours:3.5}, ...]
}
