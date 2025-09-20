import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Member } from '../models/team';
import { DataCacheService } from './data-cache.service';

@Injectable({
  providedIn: 'root',
})
export class TeamService {
  constructor(private dataCacheService: DataCacheService) {}

  getTeamMembers(): Observable<Member[]> {
    // Use cached data and normalize shape to flat Member[]
    return this.dataCacheService.getTeamMembers().pipe(
      map((raw: any) => {
        const root = Array.isArray(raw) ? raw : raw?.team || raw?.teams || [];

        const toMember = (m: any, teamName?: string): Member => {
          const name =
            m?.name ||
            m?.full_name ||
            [m?.first_name, m?.last_name].filter(Boolean).join(' ') ||
            'Unnamed';
          const title = m?.title || m?.role || 'Team Member';
          const status: 'active' | 'inactive' =
            m?.status === 'inactive' || m?.active === false ? 'inactive' : 'active';
          const email = m?.email || m?.mail || '';
          const location =
            m?.location || [m?.city, m?.country].filter(Boolean).join(', ') || 'Remote';
          const hourlyRateUSD = Number(m?.hourlyRateUSD ?? m?.hourly_rate ?? m?.rate ?? 0) || 0;
          const hoursMonth = Number(m?.hoursMonth ?? m?.hours_month ?? 0) || 0;
          const activeProjects =
            Number(
              m?.activeProjects ??
                m?.active_projects ??
                (Array.isArray(m?.projects) ? m.projects.length : 0) ??
                0
            ) || 0;
          const tasksDone = Number(m?.tasksDone ?? m?.tasks_done ?? 0) || 0;
          const skills = Array.isArray(m?.skills) ? m.skills : Array.isArray(m?.tags) ? m.tags : [];
          const avatarUrl = m?.avatarUrl || m?.avatar || m?.photo_url;
          const team = m?.team || m?.team_name || m?.teamTitle || teamName;

          const id = String(
            m?.id ||
              m?._id ||
              m?.member_id ||
              m?.email ||
              name ||
              Math.random().toString(36).slice(2)
          );

          return {
            id,
            name,
            title,
            status,
            email,
            location,
            hourlyRateUSD,
            hoursMonth,
            activeProjects,
            tasksDone,
            skills,
            avatarUrl,
            team,
          };
        };

        const members: Member[] = [];
        for (const item of root) {
          if (Array.isArray(item?.members)) {
            const teamName = item?.name || item?.team_name || item?.title || undefined;
            for (const m of item.members) members.push(toMember(m, teamName));
          } else if (Array.isArray(item?.team_members)) {
            const teamName = item?.name || item?.team_name || item?.title || undefined;
            for (const m of item.team_members) members.push(toMember(m, teamName));
          } else {
            // Already a member-like object
            members.push(toMember(item));
          }
        }

        return members;
      })
    );
  }

  // Add method to invalidate cache when team data is updated
  invalidateCache(): void {
    this.dataCacheService.invalidateTeam();
  }
}
