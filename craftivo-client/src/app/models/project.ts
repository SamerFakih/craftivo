export type ProjectStatus = 'active' | 'completed' | 'other';

export interface Project {
  progress(progress: any, arg1: number): number;
  id: string;
  title: string;
  client: string;
  description: string;
  status: ProjectStatus;
  progressPct: number;
  budgetUsed: number;
  budgetTotal: number;
  dueDateISO: string;
  team: TeamMember[];
  tags: string[];
}

export interface TeamMember {
  name: string;
  avatarUrl?: string;
}
