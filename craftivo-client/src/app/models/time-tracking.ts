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
