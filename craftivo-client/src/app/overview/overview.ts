import { CommonModule } from '@angular/common';
import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { ProgressBar } from 'primeng/progressbar';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { SummaryCards } from '../components/summary-cards/summary-cards';
import { OverviewService } from '../services/overview.service';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { OverviewData, OverviewKpiItem } from './overview.models';
import { ModalBusService } from '../services/modal-bus.service';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-overview',
  imports: [CommonModule, ProgressBar, ToastModule, SummaryCards],
  templateUrl: './overview.html',
  styleUrls: ['./overview.css'],
  standalone: true,
  providers: [MessageService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Overview {
  private overviewService = inject(OverviewService);
  private auth = inject(AuthService);
  private router = inject(Router);
  private messages = inject(MessageService);
  private modalBus = inject(ModalBusService);

  // State signals
  readonly loading = signal<boolean>(false);
  readonly error = signal<string | null>(null);
  readonly data = signal<OverviewData | null>(null);

  // Derived signals
  readonly summarys = computed<OverviewKpiItem[]>(() => {
    const d = this.data();
    if (!d) return [];
    return [
      { key: 'Total Revenue', value: d.totalRevenue, icon: 'pi pi-dollar' },
      { key: 'Active Projects', value: d.activeProjects, icon: 'pi pi-check-circle' },
      { key: 'Hours This Month', value: d.hoursThisMonth, icon: 'pi pi-clock' },
      { key: 'Team Members', value: d.teamMembers.length, icon: 'pi pi-users' },
    ];
  });

  // Dynamic project progress override: recompute using tasks if both present
  private readonly _progressMap = computed(() => {
    const d = this.data();
    if (!d) return new Map<number, number>();
    const tasks = d.todayTasks || []; // limited set (today) may not reflect all project tasks
    // If API supplies a broader task list in future, replace above with that list
    const map = new Map<number, { total: number; done: number }>();
    for (const t of tasks) {
      const pid = Number((t as any).project_id || (t as any).projectId || (t as any).project?.id);
      if (!Number.isFinite(pid) || pid <= 0) continue;
      const status = ((t as any).status || '').toString().toLowerCase();
      const bucket = map.get(pid) || { total: 0, done: 0 };
      bucket.total += 1;
      if (status === 'completed' || status === 'done' || status === 'finished') bucket.done += 1;
      map.set(pid, bucket);
    }
    const result = new Map<number, number>();
    map.forEach((v, k) => {
      if (v.total > 0) result.set(k, Math.round((v.done / v.total) * 100));
    });
    return result;
  });

  readonly projects = computed(() => {
    const d = this.data();
    if (!d) return [];
    const progressMap = this._progressMap();
    const list = d.recentProjects || [];
    if (!progressMap.size) return list;
    return list.map((p: any) => {
      const override = progressMap.get(p.id);
      return override == null ? p : { ...p, progress: override };
    });
  });
  readonly tasks = computed(() => this.data()?.todayTasks ?? []);
  readonly teamActivity = computed(() => this.data()?.teamActivity ?? []);

  ngOnInit() {
    this.load();
  }

  load(refresh = false) {
    this.loading.set(true);
    this.error.set(null);
    if (refresh) {
      this.overviewService.invalidateCache();
    }
    this.overviewService
      .getOverviewData()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (data: OverviewData) => this.data.set(data),
        error: (err) => {
          const msg = err?.error?.message || 'Failed to load overview';
          this.error.set(msg);
          this.messages.add({ severity: 'error', summary: 'Overview', detail: msg });
        },
      });
  }

  // Quick actions
  newProject() {
    this.router
      .navigate(['/dashboard/projects'])
      .then(() => this.modalBus.emit({ type: 'open-project-create' }));
  }
  newInvoice() {
    this.router
      .navigate(['/dashboard/invoices'])
      .then(() => this.modalBus.emit({ type: 'open-invoice-create' }));
  }
  startTimer() {
    this.router
      .navigate(['/dashboard/time-tracking'])
      .then(() => this.modalBus.emit({ type: 'open-time-manual' }));
  }
  inviteTeam() {
    this.router
      .navigate(['/dashboard/teams'])
      .then(() => this.modalBus.emit({ type: 'open-team-invite' }));
  }

  refresh() {
    this.load(true);
  }

  // projects = [
  //   {
  //     title: 'E-commerce Redesign',
  //     client: 'TechCorp Inc.',
  //     budget: 8500,
  //     due: '2024-04-15',
  //     progress: 75,
  //   },
  //   {
  //     title: 'E-commerce Redesign',
  //     client: 'TechCorp Inc.',
  //     budget: 8500,
  //     due: '2024-04-15',
  //     progress: 50,
  //   },
  //   {
  //     title: 'E-commerce Redesign',
  //     client: 'TechCorp Inc.',
  //     budget: 8500,
  //     due: '2024-04-15',
  //     progress: 25,
  //   },
  // ];

  // summarys = [
  //   { key: 'Total Revenue', value: 24580, icon: 'pi pi-dollar' },
  //   { key: 'Active Projects', value: 5, icon: 'pi pi-check-circle' },
  //   { key: 'Hours This Month', value: 187, icon: 'pi pi-clock' },
  //   { key: 'Team Members', value: 3, icon: 'pi pi-users' },
  // ];
  // tasks = [
  //   { name: 'Client presentation prep', title: 'E-commerce Redesign', endTime: '4:00' },
  //   { name: 'Review wireframes', title: 'E-commerce Redesign', endTime: '6:00' },
  //   { name: 'Update project timeline', title: 'E-commerce Redesign', endTime: '5:00' },
  // ];

  // teamActivity = [
  //   { name: 'Sarah Johnson', status: 'completed task', project: 'E-commerce Redesign' },
  //   { name: 'Mike Chen', status: 'logged 4.5 hours', project: 'E-commerce Redesign' },
  //   { name: 'Emma Davis', status: 'submitted invoice', project: 'E-commerce Redesign' },
  // ];

  trackByTaskId = (_: number, task: any) => task.id ?? _;
  trackByProjectId = (_: number, project: any) => project.id ?? _;
  trackByActivityName = (_: number, activity: any) => activity.name ?? _;
}
