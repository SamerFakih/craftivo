export interface Member {
  id: string;
  name: string;
  title: string; // e.g., "Senior Developer"
  status: 'active' | 'inactive';
  email: string;
  location: string; // "San Francisco, CA"
  hourlyRateUSD: number; // 80 -> $80/hr
  hoursMonth: number; // 145h
  activeProjects: number; // 3
  tasksDone: number; // 127
  skills: string[]; // ["React","Node.js","Python","AWS"]
  avatarUrl?: string;
  team?: string; // Optional team name for grouping
}
