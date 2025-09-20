import {
  Component,
  signal,
  computed,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  inject,
  effect,
} from '@angular/core';
import { Member } from '../models/team';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MemberCard } from '../components/member-card/member-card';
import { TeamService } from '../services/team.service';
import { ModalBusService } from '../services/modal-bus.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-team-page',
  standalone: true,
  imports: [MemberCard, ReactiveFormsModule, CommonModule],
  templateUrl: './team.html',
  styleUrls: ['./team.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Team implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  private fb = inject(FormBuilder);

  constructor(private teamService: TeamService) {}
  private modalBus = inject(ModalBusService);

  members = signal<Member[]>([]);
  private _busEffect = effect(() => {
    const evt = this.modalBus.event();
    if (!evt) return;
    if (evt.type === 'open-team-invite') this.openInvite();
  });

  ngOnInit() {
    this.teamService
      .getTeamMembers()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          console.log('Fetched members raw data:', data);
          this.members.set(data);
        },
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
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

  // Group members by team name (if provided). Members without a team go to "General".
  groups = computed(() => {
    const byTeam = new Map<string, Member[]>();
    for (const m of this.filtered()) {
      const team = (m as any).team || 'General';
      if (!byTeam.has(team)) byTeam.set(team, []);
      byTeam.get(team)!.push(m);
    }
    // Return stable order: team name ascending, "General" first
    const entries = Array.from(byTeam.entries());
    entries.sort((a, b) => {
      if (a[0] === 'General') return -1;
      if (b[0] === 'General') return 1;
      return a[0].localeCompare(b[0]);
    });
    return entries;
  });

  trackByMemberId(index: number, member: Member): string {
    return member.id;
  }

  // Invite modal state & form
  showInvite = signal(false);
  inviteForm = this.fb.nonNullable.group({
    name: [''],
    email: ['', [Validators.required, Validators.email]],
    role: [''],
  });

  openInvite() {
    this.inviteForm.reset({ name: '', email: '', role: '' });
    this.showInvite.set(true);
  }
  closeInvite() {
    this.showInvite.set(false);
  }
  submitInvite(ev: Event) {
    ev.preventDefault();
    if (this.inviteForm.invalid) return;
    const v = this.inviteForm.getRawValue();
    // Placeholder: push optimistic temp member; real impl should POST to backend
    const newMember: Member = {
      id: 'temp-' + Date.now(),
      name: v.name || v.email.split('@')[0],
      title: v.role || 'Member',
      status: 'active',
      email: v.email,
      location: '—',
      hourlyRateUSD: 0,
      hoursMonth: 0,
      activeProjects: 0,
      tasksDone: 0,
      skills: [],
    } as Member;
    this.members.update((m) => [newMember, ...m]);
    this.closeInvite();
  }
}
