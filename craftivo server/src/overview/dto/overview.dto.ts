export class OverviewDto {
  totalRevenue: number;
  activeProjects: number;
  hoursThisMonth: number;
  teamMembers: Array<{ id: number; name: string; avatar?: string | null }>;

  recentProjects: Array<{ id: number; name: string; createdAt: Date }>;
  todayTasks: Array<{ id: number; title: string; status: string }>;
  teamActivity: Array<{ action: string; timestamp: Date; user: string }>;
}
