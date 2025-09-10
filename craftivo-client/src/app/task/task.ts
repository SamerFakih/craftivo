import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TaskItem } from '../models/tasks';
import { TaskCard } from '../components/task-card/task-card';

type TabKey = 'all' | 'today' | 'upcoming' | 'overdue';

@Component({
  selector: 'app-tasks-page',
  standalone: true,
  imports: [CommonModule, TaskCard],
  templateUrl: './task.html',
  styleUrls: ['./task.css'],
})
export class Task {
  // Demo data – replace with API
  tasks = signal<TaskItem[]>([
    {
      id: '1',
      title: 'Design homepage mockups',
      subtitle: 'Create responsive mockups for the new homepage design',
      project: 'E-commerce Redesign',
      client: 'TechCorp Inc.',
      dueISO: '2024-08-25T15:00:00',
      assignee: { name: 'Sarah J.' },
      emailReminder: true,
      attachmentsCount: 1,
      commentsCount: 5,
      tags: ['Web Design', 'E-commerce'],
      status: 'in-progress',
    },
    {
      id: '2',
      title: 'Design homepage mockups',
      subtitle: 'Create responsive mockups for the new homepage design',
      project: 'E-commerce Redesign',
      client: 'TechCorp Inc.',
      dueISO: '2024-08-25T15:00:00',
      assignee: { name: 'Sarah J.' },
      emailReminder: true,
      attachmentsCount: 1,
      commentsCount: 5,
      tags: ['Web Design', 'E-commerce'],
      status: 'today',
    },
    {
      id: '3',
      title: 'Design homepage mockups',
      subtitle: 'Create responsive mockups for the new homepage design',
      project: 'E-commerce Redesign',
      client: 'TechCorp Inc.',
      dueISO: '2024-08-25T15:00:00',
      assignee: { name: 'Sarah J.' },
      emailReminder: true,
      attachmentsCount: 1,
      commentsCount: 5,
      tags: ['Web Design', 'E-commerce'],
      status: 'overdue',
    },
    {
      id: '4',
      title: 'Design homepage mockups',
      subtitle: 'Create responsive mockups for the new homepage design',
      project: 'E-commerce Redesign',
      client: 'TechCorp Inc.',
      dueISO: '2024-08-25T15:00:00',
      assignee: { name: 'Sarah J.' },
      emailReminder: true,
      attachmentsCount: 1,
      commentsCount: 5,
      tags: ['Web Design', 'E-commerce'],
      status: 'completed',
    },
  ]);

  // search text
  q = signal('');
  setQ(v: string) {
    this.q.set(v);
  }

  // tabs
  tab = signal<TabKey>('all');
  setTab(t: TabKey) {
    this.tab.set(t);
  }

  // derived lists & counts (no template arrow functions)
  allList = computed(() => this.tasks());
  inProgressCnt = computed(() => this.tasks().filter((t) => t.status === 'in-progress').length);
  completedCnt = computed(() => this.tasks().filter((t) => t.status === 'completed').length);
  overdueCnt = computed(() => this.tasks().filter((t) => t.status === 'overdue').length);
  totalCnt = computed(() => this.tasks().length);

  filtered = computed(() => {
    const txt = this.q().toLowerCase().trim();
    let list = this.tasks();
    switch (this.tab()) {
      case 'today':
        list = list.filter((t) => t.status === 'today');
        break;
      case 'upcoming':
        list = list.filter((t) => t.status === 'upcoming');
        break;
      case 'overdue':
        list = list.filter((t) => t.status === 'overdue');
        break;
      default:
        break;
    }
    if (!txt) return list;
    return list.filter((t) =>
      (t.title + ' ' + t.project + ' ' + t.client).toLowerCase().includes(txt)
    );
  });
}
