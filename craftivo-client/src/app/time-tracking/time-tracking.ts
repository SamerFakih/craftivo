import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TimeEntries } from '../components/time-entries/time-entries';
import { TeamOverview } from '../components/team-overview/team-overview';
import { ProjectSummary } from '../components/project-summary/project-summary';
import { MemberSummary, ProjectHoursCard, TimeEntry } from '../models/time-tracking';

type TabKey = 'entries' | 'team' | 'projects';

@Component({
  selector: 'app-time-tracking-page',
  standalone: true,
  imports: [CommonModule, TimeEntries, TeamOverview, ProjectSummary],
  templateUrl: './time-tracking.html',
  styleUrls: ['./time-tracking.css'],
})
export class TimeTracking {
  // demo timer header
  currentTime = signal('00:00:00');
  selectedProject = signal('Select project');

  // KPIs
  todayH = signal(7.5);
  weekH = signal(17.5);
  teamH = signal(61);
  revenue = signal(1432.5);

  // Tab state
  tab = signal<TabKey>('entries');
  setTab(t: TabKey) {
    this.tab.set(t);
  }

  // Demo data
  entries = signal<TimeEntry[]>([
    {
      id: 't1',
      title: 'Homepage wireframes',
      project: 'E-commerce Redesign',
      client: 'TechCorp Inc.',
      note: 'Created detailed wireframes for the new homepage layout',
      dateISO: '2024-08-25',
      startTime: '09:00',
      endTime: '12:30',
      hours: 3.5,
      amountUSD: 297.5,
      status: 'completed',
    },
    {
      id: 't2',
      title: 'Homepage wireframes',
      project: 'E-commerce Redesign',
      client: 'TechCorp Inc.',
      note: '',
      dateISO: '2024-08-25',
      startTime: '08:00',
      endTime: '12:30',
      hours: 3.5,
      amountUSD: 297.5,
      status: 'completed',
    },
    {
      id: 't3',
      title: 'Homepage wireframes',
      project: 'E-commerce Redesign',
      client: 'TechCorp Inc.',
      note: '',
      dateISO: '2024-08-25',
      startTime: '09:00',
      endTime: '12:30',
      hours: 3.5,
      amountUSD: 297.5,
      status: 'completed',
    },
  ]);

  members = signal<MemberSummary[]>([
    {
      name: 'You',
      todayHours: 11.5,
      weekHours: 42.5,
      totalHours: 101.3,
      revenueUSD: 1572.5,
      progressPct: 75,
    },
    {
      name: 'ssohour',
      todayHours: 18.5,
      weekHours: 42.5,
      totalHours: 101.3,
      revenueUSD: 1572.5,
      progressPct: 75,
    },
    {
      name: 'You',
      todayHours: 11.5,
      weekHours: 42.5,
      totalHours: 101.3,
      revenueUSD: 1572.5,
      progressPct: 75,
    },
    {
      name: 'ssohour',
      todayHours: 18.5,
      weekHours: 42.5,
      totalHours: 101.3,
      revenueUSD: 1572.5,
      progressPct: 75,
    },
  ]);

  projectCards = signal<ProjectHoursCard[]>([
    {
      project: 'E-commerce Redesign',
      client: 'TechCorp Inc.',
      totalHours: 10,
      revenueUSD: 817.5,
      recent: [
        { label: 'Homepage wireframes', hours: 3.5 },
        { label: 'Database optimization', hours: 6.5 },
      ],
    },
    {
      project: 'E-commerce Redesign',
      client: 'TechCorp Inc.',
      totalHours: 10,
      revenueUSD: 817.5,
      recent: [
        { label: 'Homepage wireframes', hours: 3.5 },
        { label: 'Database optimization', hours: 6.5 },
      ],
    },
    {
      project: 'E-commerce Redesign',
      client: 'TechCorp Inc.',
      totalHours: 10,
      revenueUSD: 817.5,
      recent: [
        { label: 'Homepage wireframes', hours: 3.5 },
        { label: 'Database optimization', hours: 6.5 },
      ],
    },
    {
      project: 'E-commerce Redesign',
      client: 'TechCorp Inc.',
      totalHours: 10,
      revenueUSD: 817.5,
      recent: [
        { label: 'Homepage wireframes', hours: 3.5 },
        { label: 'Database optimization', hours: 6.5 },
      ],
    },
  ]);
}
