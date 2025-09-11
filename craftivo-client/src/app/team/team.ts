import { Component, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Member } from '../models/team';
import { MemberCard } from '../components/member-card/member-card';
import { TeamService } from '../services/team.service';

@Component({
  selector: 'app-team-page',
  standalone: true,
  imports: [CommonModule, MemberCard],
  templateUrl: './team.html',
  styleUrls: ['./team.css'],
})
export class Team implements OnInit {
  constructor(private teamService: TeamService) {}
  members = signal<Member[]>([]);
  ngOnInit() {
    this.teamService.getTeamMembers().subscribe({
      next: (data) => {
        console.log('Fetched members raw data:', data);
        this.members.set(data);
      },
    });
  }

  // // demo data – replace with API
  // members = signal<Member[]>([
  //   {
  //     id: 'm1',
  //     name: 'Sarah Johnson',
  //     title: 'Senior Developer',
  //     status: 'active',
  //     email: 'sarah@freelancehub.com',
  //     location: 'San Francisco, CA',
  //     hourlyRateUSD: 80,
  //     hoursMonth: 145,
  //     activeProjects: 3,
  //     tasksDone: 127,
  //     skills: ['React', 'Node.js', 'Python', 'AWS'],
  //   },
  //   {
  //     id: 'm2',
  //     name: 'Mike Chen',
  //     title: 'Frontend Engineer',
  //     status: 'active',
  //     email: 'mike@freelancehub.com',
  //     location: 'Austin, TX',
  //     hourlyRateUSD: 65,
  //     hoursMonth: 132,
  //     activeProjects: 2,
  //     tasksDone: 98,
  //     skills: ['Angular', 'TypeScript', 'Tailwind'],
  //   },
  //   {
  //     id: 'm3',
  //     name: 'Emma Davis',
  //     title: 'Product Designer',
  //     status: 'inactive',
  //     email: 'emma@freelancehub.com',
  //     location: 'Remote',
  //     hourlyRateUSD: 70,
  //     hoursMonth: 110,
  //     activeProjects: 1,
  //     tasksDone: 76,
  //     skills: ['Figma', 'UX', 'Design Systems'],
  //   },
  //   {
  //     id: 'm4',
  //     name: 'John Ali',
  //     title: 'Backend Engineer',
  //     status: 'active',
  //     email: 'john@freelancehub.com',
  //     location: 'San Jose, CA',
  //     hourlyRateUSD: 90,
  //     hoursMonth: 168,
  //     activeProjects: 3,
  //     tasksDone: 141,
  //     skills: ['Go', 'PostgreSQL', 'AWS'],
  //   },
  // ]);

  // search
  q = signal('');
  onSearchInput(e: Event) {
    this.q.set((e.target as HTMLInputElement).value);
  }

  // KPIs
  totalMembers = computed(() => this.members().length);
  activeMembers = computed(() => this.members().filter((m) => m.status === 'active').length);
  totalHours = computed(() => this.members().reduce((s, m) => s + m.hoursMonth, 0));
  avgPerformance = computed(() => 4.8); // placeholder to match screenshot

  filtered = computed(() => {
    const term = this.q().toLowerCase().trim();
    if (!term) return this.members();
    return this.members().filter((m) =>
      (m.name + ' ' + m.title + ' ' + m.skills.join(' ')).toLowerCase().includes(term)
    );
  });
}
