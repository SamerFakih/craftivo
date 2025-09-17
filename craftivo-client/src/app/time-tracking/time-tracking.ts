import {
  Component,
  computed,
  signal,
  OnInit,
  OnDestroy,
  inject,
  ChangeDetectionStrategy,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TimeEntries } from '../components/time-entries/time-entries';
import { TeamOverview } from '../components/team-overview/team-overview';
import { ProjectSummary } from '../components/project-summary/project-summary';
import { MemberSummary, ProjectHoursCard, TimeEntry } from '../models/time-tracking';
import { TimeTrackingService } from '../services/time-tracking.service';
import { ModalBusService } from '../services/modal-bus.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';

type TabKey = 'entries' | 'team' | 'projects';

@Component({
  selector: 'app-time-tracking-page',
  standalone: true,
  imports: [CommonModule, TimeEntries, TeamOverview, ProjectSummary, ReactiveFormsModule],
  templateUrl: './time-tracking.html',
  styleUrls: ['./time-tracking.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TimeTracking implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private fb = inject(FormBuilder);

  constructor(private timeTrackingService: TimeTrackingService) {}
  private modalBus = inject(ModalBusService);

  // fetch time entries from API
  entries = signal<TimeEntry[]>([]);
  totalCnt = computed(() => this.entries().length);

  ngOnInit() {
    this.timeTrackingService
      .getTimeEntries()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          console.log('Fetched time entries raw data:', data);
          // The API returns time entries array directly, not wrapped in data.entries
          const entriesArray = Array.isArray(data) ? data : data.entries || [];
          this.entries.set(entriesArray);
        },
      });
  }
  // effect for modal bus
  private _busEffect = effect(() => {
    const evt = this.modalBus.event();
    if (!evt) return;
    if (evt.type === 'open-time-manual') this.openManual();
  });

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    // Clear running timer interval if any
    if (this._timerId) {
      clearInterval(this._timerId);
      this._timerId = null as any;
    }
  }

  // Manual Entry modal state
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
    status: ['completed' as const],
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
    this.showManual.set(true);
  }
  closeManual() {
    this.showManual.set(false);
  }
  submitManual() {
    if (this.manualForm.invalid) return;
    const v = this.manualForm.getRawValue();
    const id = `t${Date.now()}`;
    const entry: TimeEntry = { id, ...v } as TimeEntry;
    this.entries.update((list) => [entry, ...list]);
    this.closeManual();
  }
  // Timer state
  currentTime = signal('00:00:00');
  selectedProject = signal('E-commerce Redesign');
  timerActive = signal(false); // a session exists

  // KPIs derived from entries
  todayH = computed(() =>
    this.entries()
      .filter((e) => e.dateISO === new Date().toISOString().slice(0, 10))
      .reduce((s, e) => s + e.hours, 0)
  );
  weekH = computed(() => {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay()); // Sunday
    const ws = weekStart.toISOString().slice(0, 10);
    return this.entries()
      .filter((e) => e.dateISO >= ws)
      .reduce((s, e) => s + e.hours, 0);
  });
  teamH = computed(() => this.entries().reduce((s, e) => s + e.hours, 0));
  revenue = computed(() => this.entries().reduce((s, e) => s + e.amountUSD, 0));

  // Tab state
  tab = signal<TabKey>('entries');
  setTab(t: TabKey) {
    this.tab.set(t);
  }

  // Demo data
  // entries = signal<TimeEntry[]>([
  //   {
  //     id: 't1',
  //     title: 'Homepage wireframes',
  //     project: 'E-commerce Redesign',
  //     client: 'TechCorp Inc.',
  //     note: 'Created detailed wireframes for the new homepage layout',
  //     dateISO: '2024-08-25',
  //     startTime: '09:00',
  //     endTime: '12:30',
  //     hours: 3.5,
  //     amountUSD: 297.5,
  //     status: 'completed',
  //   },
  //   {
  //     id: 't2',
  //     title: 'Homepage wireframes',
  //     project: 'E-commerce Redesign',
  //     client: 'TechCorp Inc.',
  //     note: '',
  //     dateISO: '2024-08-25',
  //     startTime: '08:00',
  //     endTime: '12:30',
  //     hours: 3.5,
  //     amountUSD: 297.5,
  //     status: 'completed',
  timerRunning = signal(false);
  private _timerId: any;
  private _timerStart!: Date; // start of current run segment
  private _sessionStart: Date | null = null; // first start time for this session
  private _pauseAt: Date | null = null; // when paused (for end time)
  private _elapsedMs = 0; // accumulated across pauses

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
    if (this.timerRunning()) return; // already ticking
    const proj = this.selectedProject();
    if (!proj || proj === 'Select project') return;
    if (!this.timerActive()) {
      // new session
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
    // accumulate time and pause ticking
    const now = new Date();
    this._elapsedMs += now.getTime() - this._timerStart.getTime();
    this._pauseAt = now;
    if (this._timerId) {
      clearInterval(this._timerId);
      this._timerId = null as any;
    }
    this.timerRunning.set(false);
    // update display to reflect paused elapsed
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
      // add running segment then stop
      end = new Date();
      this._elapsedMs += end.getTime() - this._timerStart.getTime();
    } else if (this._pauseAt) {
      end = this._pauseAt;
    }
    if (this._timerId) {
      clearInterval(this._timerId);
      this._timerId = null as any;
    }
    this.timerRunning.set(false);

    // Prefill manual entry
    const toHM = (d: Date) => `${this.fmtTwo(d.getHours())}:${this.fmtTwo(d.getMinutes())}`;
    const hours = Math.round((this._elapsedMs / 3600000) * 10) / 10; // round to 0.1h
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
    // reset session
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
  //   },
  //   {
  //     id: 't3',
  //     title: 'Homepage wireframes',
  //     project: 'E-commerce Redesign',
  //     client: 'TechCorp Inc.',
  //     note: '',
  //     dateISO: '2024-08-25',
  //     startTime: '09:00',
  //     endTime: '12:30',
  //     hours: 3.5,
  //     amountUSD: 297.5,
  //     status: 'completed',
  //   },
  // ]);

  members = computed<MemberSummary[]>(() => {
    // Simple single-user demo aggregation; adapt for real multi-user data
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
}
