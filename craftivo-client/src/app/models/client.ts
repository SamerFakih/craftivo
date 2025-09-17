export interface ClientModel {
  id: string;
  name: string; // “TechCorp Inc.”
  status: 'active' | 'inactive' | 'prospect';
  email: string;
  location: string; // “San Francisco, CA”
  primaryContact: string; // “Sarah Williams”
  industry: string; // “Technology”
  joinedISO: string; // “2024-01-15”
  tags: string[]; // [“Technology”, “Long-term”, “High-value”]
  stats: {
    totalProjects: number;
    activeProjects: number;
    totalRevenueUSD: number; // 12800 -> $12,800
    lastContactISO: string; // “2024-08-20”
  };
  avatarUrl?: string;
  rating?: number; // for KPI avg rating, optional
}
