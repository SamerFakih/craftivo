export type TaskStatus = 'in-progress' | 'completed' | 'overdue' | 'today' | 'upcoming';

export interface TaskItem {
  id: string;
  title: string;
  subtitle: string; // “Create responsive mockups…”
  project: string; // “E-commerce Redesign”
  client: string; // “TechCorp Inc.”
  dueISO: string; // “2024-08-25T15:00:00”
  assignee: { name: string; avatarUrl?: string };
  emailReminder?: boolean;
  attachmentsCount: number;
  commentsCount: number;
  tags: string[]; // e.g. [ 'Web Design', 'E-commerce' ]
  status: TaskStatus;
}
