export type ProjectStatus = 'active' | 'completed' | 'other';

export interface Project {
  id: number;
  name: string;
  description: string;
  status: ProjectStatus;
  progress: number;
  budget: string | number;
  spent_amount: string | number;
  hourly_rate: string | number;
  billing_type: string;
  currency: string;
  priority: string;
  start_date: string;
  end_date: string;
  created_at: string;
  updated_at: string;
  uuid: string;
  active: boolean;
  client_id: number;
  owner_id: number;

  // Mapped properties from API transformation
  client: string; // Mapped from clients?.name
  team: TeamMember[]; // Mapped from project_members

  // Original nested structures (may be present in API response)
  clients?: {
    id: number;
    name: string;
  };
  project_members?: {
    users?: {
      first_name?: string;
      last_name?: string;
      profile_image?: string;
    };
  }[];
}

export interface TeamMember {
  name: string;
  avatarUrl?: string;
}
