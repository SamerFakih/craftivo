import { Component, computed, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TaskItem } from '../models/tasks';
import { TaskCard } from '../components/task-card/task-card';
import { TaskService } from '../services/task.service';

type TabKey = 'all' | 'today' | 'upcoming' | 'overdue';

@Component({
  selector: 'app-tasks-page',
  standalone: true,
  imports: [CommonModule, TaskCard],
  templateUrl: './task.html',
  styleUrls: ['./task.css'],
})
export class Task implements OnInit {
  constructor(private taskService: TaskService) {}
  // fetch tasks from API
  tasks = signal<TaskItem[]>([]);
  ngOnInit() {
    console.log('Tasks ngOnInit called');
    this.taskService.getTasks().subscribe({
      next: (data) => {
        console.log('Fetched tasks raw data:', data);

        // Handle both direct array and wrapped data
        const tasksArray = Array.isArray(data) ? data : data.tasks || [];

        if (Array.isArray(tasksArray) && tasksArray.length > 0) {
          const mappedTasks: TaskItem[] = tasksArray.map((task: any): TaskItem => {
            console.log('Processing task:', task);
            return {
              id: task.id.toString(),
              title: task.title,
              subtitle: task.subtitle,
              project: task.project,
              client: task.client,
              dueISO: task.dueISO,
              assignee: task.assignee || { name: 'Unassigned', avatarUrl: '' },
              emailReminder: task.emailReminder || false,
              attachmentsCount: task.attachmentsCount || 0,
              commentsCount: task.commentsCount || 0,
              tags: task.tags || [],
              status: this.mapTaskStatus(task.status),
            };
          });

          console.log('Mapped tasks:', mappedTasks);
          this.tasks.set(mappedTasks);
          console.log('Tasks signal after set:', this.tasks());
        } else {
          console.warn('No tasks data found or data is not an array:', data);
          this.tasks.set([]);
        }
      },
      error: (error) => {
        console.error('Error fetching tasks:', error);
        this.tasks.set([]);
      },
    });
  }

  // Map API status to our TaskStatus type
  private mapTaskStatus(status: string): TaskItem['status'] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    switch (status.toLowerCase()) {
      case 'completed':
        return 'completed';
      case 'in-progress':
      case 'in_progress':
        return 'in-progress';
      case 'overdue':
        return 'overdue';
      case 'pending':
        // Check if due date is today or in the future
        return 'today'; // You can enhance this logic based on due date
      default:
        return 'upcoming';
    }
  }
  // Demo data – replace with API
  // tasks = signal<TaskItem[]>([
  //   {
  //     id: '1',
  //     title: 'Design homepage mockups',
  //     subtitle: 'Create responsive mockups for the new homepage design',
  //     project: 'E-commerce Redesign',
  //     client: 'TechCorp Inc.',
  //     dueISO: '2024-08-25T15:00:00',
  //     assignee: { name: 'Sarah J.' },
  //     emailReminder: true,
  //     attachmentsCount: 1,
  //     commentsCount: 5,
  //     tags: ['Web Design', 'E-commerce'],
  //     status: 'in-progress',
  //   },
  //   {
  //     id: '2',
  //     title: 'Design homepage mockups',
  //     subtitle: 'Create responsive mockups for the new homepage design',
  //     project: 'E-commerce Redesign',
  //     client: 'TechCorp Inc.',
  //     dueISO: '2024-08-25T15:00:00',
  //     assignee: { name: 'Sarah J.' },
  //     emailReminder: true,
  //     attachmentsCount: 1,
  //     commentsCount: 5,
  //     tags: ['Web Design', 'E-commerce'],
  //     status: 'today',
  //   },
  //   {
  //     id: '3',
  //     title: 'Design homepage mockups',
  //     subtitle: 'Create responsive mockups for the new homepage design',
  //     project: 'E-commerce Redesign',
  //     client: 'TechCorp Inc.',
  //     dueISO: '2024-08-25T15:00:00',
  //     assignee: { name: 'Sarah J.' },
  //     emailReminder: true,
  //     attachmentsCount: 1,
  //     commentsCount: 5,
  //     tags: ['Web Design', 'E-commerce'],
  //     status: 'overdue',
  //   },
  //   {
  //     id: '4',
  //     title: 'Design homepage mockups',
  //     subtitle: 'Create responsive mockups for the new homepage design',
  //     project: 'E-commerce Redesign',
  //     client: 'TechCorp Inc.',
  //     dueISO: '2024-08-25T15:00:00',
  //     assignee: { name: 'Sarah J.' },
  //     emailReminder: true,
  //     attachmentsCount: 1,
  //     commentsCount: 5,
  //     tags: ['Web Design', 'E-commerce'],
  //     status: 'completed',
  //   },
  // ]);

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
  inProgressCnt = computed(
    () => this.tasks().filter((t) => t.status === 'in-progress' || t.status === 'today').length
  );
  completedCnt = computed(() => this.tasks().filter((t) => t.status === 'completed').length);
  overdueCnt = computed(() => this.tasks().filter((t) => this.isOverdue(t)).length);
  totalCnt = computed(() => this.tasks().length);

  // Helper method to check if task is overdue
  private isOverdue(task: TaskItem): boolean {
    const dueDate = new Date(task.dueISO);
    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today
    return dueDate < today && task.status !== 'completed';
  }

  filtered = computed(() => {
    const txt = this.q().toLowerCase().trim();
    let list = this.tasks();

    switch (this.tab()) {
      case 'today':
        // Show tasks due today or currently active
        list = list.filter((t) => {
          const dueDate = new Date(t.dueISO);
          const today = new Date();
          const isToday = dueDate.toDateString() === today.toDateString();
          return isToday || t.status === 'today' || t.status === 'in-progress';
        });
        break;
      case 'upcoming':
        // Show tasks due in the future
        list = list.filter((t) => {
          const dueDate = new Date(t.dueISO);
          const today = new Date();
          return dueDate > today && t.status !== 'completed';
        });
        break;
      case 'overdue':
        // Show overdue tasks
        list = list.filter((t) => this.isOverdue(t));
        break;
      default:
        // Show all tasks
        break;
    }

    if (!txt) return list;
    return list.filter((t) =>
      (t.title + ' ' + t.project + ' ' + t.client).toLowerCase().includes(txt)
    );
  });
}
