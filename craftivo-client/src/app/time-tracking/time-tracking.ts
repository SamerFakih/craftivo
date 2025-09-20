// Clean replacement of corrupted file
import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  computed,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { TimeEntries } from '../components/time-entries/time-entries';
import { TeamOverview } from '../components/team-overview/team-overview';
import { ProjectSummary } from '../components/project-summary/project-summary';
import { MemberSummary, ProjectHoursCard, TimeEntry } from '../models/time-tracking';
import { TimeTrackingService } from '../services/time-tracking.service';
import { ModalBusService } from '../services/modal-bus.service';
import { Subject, of } from 'rxjs';
import { takeUntil, catchError } from 'rxjs/operators';

type TabKey = 'entries' | 'team' | 'projects';

@Component({
  selector: 'app-time-tracking',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TimeEntries, TeamOverview, ProjectSummary],
  templateUrl: './time-tracking.html',
  styleUrls: ['./time-tracking.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TimeTracking {
  private destroy$ = new Subject<void>();
  private fb = inject(FormBuilder);
  private modalBus = inject(ModalBusService);
  private service = inject(TimeTrackingService);

  // Data
  entries = signal<TimeEntry[]>([]);
  loading = signal(false);
  saving = signal(false);
  saveError = signal<string | null>(null);
  editing = signal<TimeEntry | null>(null);

  // Filters
  projectFilter = signal<string>('all');
  statusFilter = signal<'all' | 'completed' | 'running'>('all');
  dateRange = signal<{ from?: string; to?: string }>({});

  visibleEntries = computed(() => {
    const list = this.entries();
    const proj = this.projectFilter();
    const status = this.statusFilter();
    const { from, to } = this.dateRange();
    return list.filter((e) => {
      if (proj !== 'all' && e.project !== proj) return false;
      if (status !== 'all' && e.status !== status) return false;
      if (from && e.dateISO < from) return false;
      if (to && e.dateISO > to) return false;
      return true;
    });
  });
  projectSummaries = computed(() => {
    const map = new Map<string, { hours: number; revenue: number }>();
    for (const e of this.visibleEntries()) {
      if (!map.has(e.project)) map.set(e.project, { hours: 0, revenue: 0 });
      const acc = map.get(e.project)!;
      acc.hours += e.hours;
      acc.revenue += e.amountUSD;
    }
    return Array.from(map.entries()).map(([project, v]) => ({ project, ...v }));
  });

  // Manual entry modal
  showManual = signal(false);
  manualForm = this.fb.nonNullable.group({
    title: ['', Validators.required],
    project: ['', Validators.required],
    client: ['', Validators.required],
    dateISO: ['', Validators.required],
    startTime: ['', Validators.required],
    endTime: ['', Validators.required],
    hours: [0, [Validators.min(0)]],
    amountUSD: [0, [Validators.min(0)]],
    note: [''],
    status: ['completed'],
  });
  openManual() {
    this.manualForm.reset({
      title: '',
      project: '',
      client: '',
      dateISO: '',
      startTime: '',
      endTime: '',
      hours: 0,
      amountUSD: 0,
      note: '',
      status: 'completed',
    });
    this.editing.set(null);
    this.showManual.set(true);
  }
  closeManual() {
    this.showManual.set(false);
  }
  openEdit(entry: TimeEntry) {
    this.editing.set(entry);
    this.manualForm.patchValue({
      title: entry.title,
      project: entry.project,
      client: entry.client,
      dateISO: entry.dateISO,
      startTime: entry.startTime,
      endTime: entry.endTime,
      hours: entry.hours,
      amountUSD: entry.amountUSD,
      note: entry.note || '',
      status: entry.status,
    });
    this.showManual.set(true);
  }
  deleteEntry(id: string) {
    const prev = this.entries();
    this.entries.update((list) => list.filter((e) => e.id !== id));
    this.service
      .deleteTimeEntry(id)
      .pipe(
        catchError((err) => {
          this.entries.set(prev);
          this.saveError.set(this.errMsg(err));
          return of(null);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe();
  }
  submitManual() {
    if (this.manualForm.invalid) {
      this.manualForm.markAllAsTouched();
      return;
    }
    const raw0 = this.manualForm.getRawValue();
    const trim = (v: any) => (typeof v === 'string' ? v.trim() : v);
    const raw = {
      ...raw0,
      title: trim(raw0.title),
      project: trim(raw0.project),
      client: trim(raw0.client),
      note: trim(raw0.note || ''),
    };
    // Auto compute hours if 0 or not provided but start/end present
    if ((!raw.hours || raw.hours === 0) && raw.startTime && raw.endTime) {
      const toMinutes = (t: string) => {
        const [h, m] = t.split(':').map(Number);
        return h * 60 + m;
      };
      const diff = toMinutes(raw.endTime) - toMinutes(raw.startTime);
      if (diff > 0) raw.hours = Math.round((diff / 60) * 10) / 10;
    }
    const editing = this.editing();
    this.saving.set(true);
    this.saveError.set(null);
    if (editing) {
      const snapshot = this.entries();
      this.entries.update((list) =>
        list.map((e) => (e.id === editing.id ? ({ ...e, ...raw } as TimeEntry) : e))
      );
      this.service
        .updateTimeEntry(editing.id, { ...raw, status: raw.status as 'completed' | 'running' })
        .pipe(
          catchError((err) => {
            this.entries.set(snapshot);
            this.saveError.set(this.errMsg(err));
            return of(null);
          }),
          takeUntil(this.destroy$)
        )
        .subscribe((res) => {
          if (res) this.finishSave();
        });
    } else {
      const tempId = 'tmp-' + Date.now();
      const optimistic: TimeEntry = { id: tempId, ...raw } as TimeEntry;
      const snapshot = this.entries();
      this.entries.update((list) => [optimistic, ...list]);
      this.service
        .createTimeEntry({ ...raw, status: raw.status as 'completed' | 'running' })
        .pipe(
          catchError((err) => {
            this.entries.set(snapshot);
            this.saveError.set(this.errMsg(err));
            return of(null);
          }),
          takeUntil(this.destroy$)
        )
        .subscribe((res) => {
          if (res?.data) {
            this.entries.update((list) => list.map((e) => (e.id === tempId ? res.data : e)));
          }
          this.finishSave();
        });
    }
  }
  private finishSave() {
    this.saving.set(false);
    if (!this.saveError()) {
      this.showManual.set(false);
      this.editing.set(null);
    }
  }
  private errMsg(err: any) {
    return err?.error?.error?.message || err?.message || 'Request failed';
  }
  exportCsv() {
    const rows = [
      [
        'Title',
        'Project',
        'Client',
        'Date',
        'Start',
        'End',
        'Hours',
        'AmountUSD',
        'Status',
        'Note',
      ],
      ...this.visibleEntries().map((e) => [
        e.title,
        e.project,
        e.client,
        e.dateISO,
        e.startTime,
        e.endTime,
        String(e.hours),
        String(e.amountUSD),
        e.status,
        (e.note || '').replace(/\n/g, ' '),
      ]),
    ];
    const csv = rows
      .map((r) => r.map((f) => '"' + String(f).replace(/"/g, '""') + '"').join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'time-entries.csv';
    a.click();
    URL.revokeObjectURL(a.href);
  }

  // Timer
  currentTime = signal('00:00:00');
  selectedProject = signal('');
  timerActive = signal(false);
  timerRunning = signal(false);
  private _timerId: any;
  private _timerStart!: Date;
  private _sessionStart: Date | null = null;
  private _pauseAt: Date | null = null;
  private _elapsedMs = 0;

  todayH = computed(() =>
    this.entries()
      .filter((e) => e.dateISO === new Date().toISOString().slice(0, 10))
      .reduce((s, e) => s + e.hours, 0)
  );
  weekH = computed(() => {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    const ws = weekStart.toISOString().slice(0, 10);
    return this.entries()
      .filter((e) => e.dateISO >= ws)
      .reduce((s, e) => s + e.hours, 0);
  });
  teamH = computed(() => this.entries().reduce((s, e) => s + e.hours, 0));
  revenue = computed(() => this.entries().reduce((s, e) => s + e.amountUSD, 0));

  tab = signal<TabKey>('entries');
  setTab(t: TabKey) {
    this.tab.set(t);
  }

  members = computed<MemberSummary[]>(() => {
    const today = this.todayH();
    const week = this.weekH();
    const total = this.teamH();
    const rev = this.revenue();
    return [
      {
        name: 'You',
        todayHours: today,
        weekHours: week,
        totalHours: total,
        revenueUSD: rev,
        progressPct: Math.min(100, Math.round((week / 40) * 100)),
      },
    ];
  });
  projectCards = computed<ProjectHoursCard[]>(() => {
    const byProject = new Map<
      string,
      {
        client: string;
        totalHours: number;
        revenueUSD: number;
        recent: { label: string; hours: number }[];
      }
    >();
    for (const e of this.entries()) {
      const key = `${e.project}__${e.client}`;
      if (!byProject.has(key))
        byProject.set(key, { client: e.client, totalHours: 0, revenueUSD: 0, recent: [] });
      const acc = byProject.get(key)!;
      acc.totalHours += e.hours;
      acc.revenueUSD += e.amountUSD;
      acc.recent.unshift({ label: e.title, hours: e.hours });
      acc.recent = acc.recent.slice(0, 5);
    }
    return Array.from(byProject.entries()).map(([k, v]) => ({
      project: k.split('__')[0],
      client: v.client,
      totalHours: v.totalHours,
      revenueUSD: v.revenueUSD,
      recent: v.recent,
    }));
  });

  // Distinct list of project names for filter dropdown
  uniqueProjects = computed<string[]>(() => {
    const set = new Set<string>();
    for (const e of this.entries()) {
      if (e.project) set.add(e.project);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  });

  // Aggregated hours per project considering status + date filters (but NOT the project filter itself)
  private projectHoursMap = computed<Record<string, number>>(() => {
    const status = this.statusFilter();
    const { from, to } = this.dateRange();
    const hours: Record<string, number> = {};
    for (const e of this.entries()) {
      if (status !== 'all' && e.status !== status) continue;
      if (from && e.dateISO < from) continue;
      if (to && e.dateISO > to) continue;
      hours[e.project] = (hours[e.project] || 0) + e.hours;
    }
    return hours;
  });
  projectHours(project: string) {
    return this.projectHoursMap()[project] || 0;
  }
  // Backwards compatibility for older template reference (projectCount -> projectHours)
  projectCount(project: string) {
    return this.projectHours(project);
  }

  constructor() {
    // Initial load from cache or backend
    this.service
      .getTimeEntries()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          const arr = Array.isArray(data) ? data : (data as any).data || [];
          this.entries.set(arr);
        },
      });
  }
  private _busEffect = effect(() => {
    const evt = this.modalBus.event();
    if (!evt) return;
    if (evt.type === 'open-time-manual') this.openManual();
  });
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    if (this._timerId) {
      clearInterval(this._timerId);
      this._timerId = null;
    }
  }

  onProjectChange(e: Event) {
    const val = (e.target as HTMLSelectElement).value;
    this.selectedProject.set(val);
  }
  private fmtTwo(n: number) {
    return n < 10 ? `0${n}` : `${n}`;
  }
  private updateClock = () => {
    const ms = this._elapsedMs + (Date.now() - this._timerStart.getTime());
    const totalSec = Math.floor(ms / 1000);
    const hh = Math.floor(totalSec / 3600);
    const mm = Math.floor((totalSec % 3600) / 60);
    const ss = totalSec % 60;
    this.currentTime.set(`${this.fmtTwo(hh)}:${this.fmtTwo(mm)}:${this.fmtTwo(ss)}`);
  };
  startTimer() {
    if (this.timerRunning()) return;
    const proj = this.selectedProject();
    if (!proj || proj === 'Select project') return;
    if (!this.timerActive()) {
      this._sessionStart = new Date();
      this._elapsedMs = 0;
      this.currentTime.set('00:00:00');
      this.timerActive.set(true);
    }
    this._pauseAt = null;
    this._timerStart = new Date();
    this.timerRunning.set(true);
    this._timerId = setInterval(this.updateClock, 1000);
  }
  pauseTimer() {
    if (!this.timerRunning() || !this.timerActive()) return;
    const now = new Date();
    this._elapsedMs += now.getTime() - this._timerStart.getTime();
    this._pauseAt = now;
    if (this._timerId) {
      clearInterval(this._timerId);
      this._timerId = null;
    }
    this.timerRunning.set(false);
    const totalSec = Math.floor(this._elapsedMs / 1000);
    const hh = Math.floor(totalSec / 3600);
    const mm = Math.floor((totalSec % 3600) / 60);
    const ss = totalSec % 60;
    this.currentTime.set(`${this.fmtTwo(hh)}:${this.fmtTwo(mm)}:${this.fmtTwo(ss)}`);
  }
  resumeTimer() {
    if (this.timerRunning() || !this.timerActive()) return;
    this.startTimer();
  }
  stopTimer() {
    if (!this.timerActive()) return;
    let end = new Date();
    if (this.timerRunning()) {
      end = new Date();
      this._elapsedMs += end.getTime() - this._timerStart.getTime();
    } else if (this._pauseAt) {
      end = this._pauseAt;
    }
    if (this._timerId) {
      clearInterval(this._timerId);
      this._timerId = null;
    }
    this.timerRunning.set(false);
    const toHM = (d: Date) => `${this.fmtTwo(d.getHours())}:${this.fmtTwo(d.getMinutes())}`;
    const hours = Math.round((this._elapsedMs / 3600000) * 10) / 10;
    const start = this._sessionStart ?? end;
    this.openManual();
    this.manualForm.patchValue({
      dateISO: start.toISOString().slice(0, 10),
      startTime: toHM(start),
      endTime: toHM(end),
      hours,
      project: this.selectedProject(),
      status: 'completed',
    });
    this.timerActive.set(false);
    this._elapsedMs = 0;
    this._sessionStart = null;
    this._pauseAt = null;
    this.currentTime.set('00:00:00');
  }
  onStartStop() {
    this.timerActive() ? this.stopTimer() : this.startTimer();
  }
  onPauseResume() {
    this.timerRunning() ? this.pauseTimer() : this.resumeTimer();
  }
  onTimerToggle(e: Event) {
    const checked = (e.target as HTMLInputElement).checked;
    if (checked) {
      if (!this.timerActive()) this.startTimer();
      else if (!this.timerRunning()) this.resumeTimer();
    } else {
      if (this.timerRunning()) this.pauseTimer();
      else if (this.timerActive()) this.stopTimer();
    }
  }

  setProjectFilter(v: string) {
    this.projectFilter.set(v || 'all');
  }
  setStatusFilter(v: 'all' | 'completed' | 'running') {
    this.statusFilter.set(v);
  }
  setDateRange(from?: string, to?: string) {
    this.dateRange.set({ from, to });
  }
  onStatusSelect(raw: string) {
    if (raw === 'completed' || raw === 'running' || raw === 'all') this.setStatusFilter(raw);
  }
  private _filterEffect = effect(() => {
    const proj = this.projectFilter();
    const status = this.statusFilter();
    const { from, to } = this.dateRange();
    const originalProject = proj !== 'all' ? proj.trim() : null;
    // Server currently returns 400 when passing ?project=<name>. We fetch without project
    // and rely on existing client-side filtering (visibleEntries, projectFilter, etc.).
    const serverQuery: any = {};
    if (status !== 'all') serverQuery.status = status;
    if (from) serverQuery.dateFrom = from;
    if (to) serverQuery.dateTo = to;
    // Debug
    // eslint-disable-next-line no-console
    console.log(
      '[TimeTracking] Loading time entries (serverQuery)',
      serverQuery,
      'localProject=',
      originalProject
    );
    this.loading.set(true);
    this.service
      .listTimeEntries(serverQuery)
      .pipe(
        takeUntil(this.destroy$),
        catchError((err) => {
          // eslint-disable-next-line no-console
          console.error('[TimeTracking] listTimeEntries failed (no project param)', err);
          this.saveError.set(this.errMsg(err));
          return of(null);
        })
      )
      .subscribe((res) => {
        if (res?.data) {
          // If the backend ever adds server-side project filtering, we can re-enable it.
          // For now we just set all and rely on computed visibleEntries.
          this.entries.set(res.data);
        }
        this.loading.set(false);
      });
  });
}
