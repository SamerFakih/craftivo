// Strongly typed models for the Overview dashboard
// These align with normalized shapes produced in DataCacheService.getOverview()

export interface ProjectSummary {
  id?: string | number;
  name: string;
  client: { name: string } | null;
  budget: number;
  due: string;
  progress: number; // 0-100
}

export interface TaskSummary {
  id?: string | number;
  title: string;
  projects: { name: string } | null; // backend may send project or projects
  due_time: string; // human-readable or ISO date
  status: string;
}

export interface TeamActivityItem {
  name: string;
  status: string;
  project: string;
}

export interface OverviewKpiItem {
  key: string;
  value: number;
  icon: string; // css class for icon
}

export interface OverviewData {
  totalRevenue: number;
  activeProjects: number;
  hoursThisMonth: number;
  teamMembers: any[]; // Could refine later
  recentProjects: ProjectSummary[];
  teamActivity: TeamActivityItem[];
  todayTasks: TaskSummary[];
}
