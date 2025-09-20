import {
  Component,
  computed,
  signal,
  OnInit,
  OnDestroy,
  ChangeDetectorRef,
  inject,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TaskItem } from '../models/tasks';
import { TaskCard } from '../components/task-card/task-card';
import { TaskService } from '../services/task.service';
import { ProjectService } from '../services/project.service';
import { TeamService } from '../services/team.service';
import { ModalBusService } from '../services/modal-bus.service';
import { Subject, takeUntil } from 'rxjs';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';

type TabKey = 'all' | 'today' | 'upcoming' | 'overdue';

@Component({
  selector: 'app-tasks-page',
  standalone: true,
  imports: [CommonModule, TaskCard, ReactiveFormsModule],
  templateUrl: './task.html',
  styleUrls: ['./task.css'],
})
export class Task implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private fb = inject(FormBuilder);

  constructor(
    private taskService: TaskService,
    private cdr: ChangeDetectorRef,
    private projectService: ProjectService,
    private teamService: TeamService
  ) {}
  private modalBus = inject(ModalBusService);
  // fetch tasks from API
  tasks = signal<TaskItem[]>([]);
  isLoading = signal(false);
  error = signal<string | null>(null);
  isSubmitting = signal(false);
  submitError = signal<string | null>(null);
  private _busEffect = effect(() => {
    const evt = this.modalBus.event();
    if (!evt) return;
    if (evt.type === 'open-task-create') this.openCreate();
  });
  ngOnInit() {
    this.loadTasks();
    this.loadProjects();
    this.loadTeamMembers();
  }

  // Projects options for the select (id + name)
  projectOptions = signal<Array<{ id: string; name: string }>>([]);
  private loadProjects() {
    this.projectService
      .getProjects()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          const arr = Array.isArray(data) ? data : data.projects || [];
          const mapped: Array<{ id: string; name: string }> = (arr as any[])
            .map((p) => ({
              id: String(p?.id ?? p?._id ?? p?.uuid ?? p?.project_id ?? ''),
              name: p?.name ?? p?.title ?? 'Untitled Project',
            }))
            .filter((p) => p.id);
          this.projectOptions.set(mapped);

          // Preselect the first project on create if none selected
          if (this.taskMode() === 'create') {
            const first = mapped[0];
            const ctrl = this.createTaskForm.controls.projectId;
            if (first && !ctrl.value) {
              ctrl.setValue(first.id);
            }
          }

          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error loading projects for task form:', err);
          // Non-blocking for the page
        },
      });
  }

  // Assignee options (id + name)
  assigneeOptions = signal<Array<{ id: string; name: string; avatarUrl?: string }>>([]);
  private loadTeamMembers() {
    this.teamService
      .getTeamMembers()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (members) => {
          const mapped = (members || [])
            .map((m: any) => ({
              id: String(m?.id ?? m?._id ?? m?.member_id ?? m?.email ?? ''),
              name: m?.name ?? [m?.first_name, m?.last_name].filter(Boolean).join(' ') ?? 'Unnamed',
              avatarUrl: m?.avatarUrl ?? m?.avatar ?? m?.photo_url ?? '',
            }))
            .filter((m) => m.id);
          this.assigneeOptions.set(mapped);
          // If we're creating and no assignee selected yet, default to first
          if (this.taskMode() === 'create') {
            const first = mapped[0];
            const ctrl = this.createTaskForm.controls.assigneeId;
            if (first && !ctrl.value) ctrl.setValue(first.id);
          }
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error loading team members for task form:', err);
        },
      });
  }

  private loadTasks() {
    this.isLoading.set(true);
    this.error.set(null);
    this.taskService
      .getTasks()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          // Handle both direct array and wrapped data
          const tasksArray = Array.isArray(data) ? data : data.tasks || [];

          const mappedTasks: TaskItem[] = (Array.isArray(tasksArray) ? tasksArray : []).map(
            (task: any): TaskItem => {
              const id = (task?.id ?? task?._id ?? task?.task_id ?? '').toString();
              const projectName =
                task?.project?.name ??
                task?.projects?.name ??
                task?.project_name ??
                task?.project ??
                '';
              const clientName =
                task?.client?.name ??
                task?.clients?.name ??
                task?.client_name ??
                task?.client ??
                '';
              const due =
                task?.dueISO ??
                task?.due_time ??
                task?.due ??
                task?.due_date ??
                new Date().toISOString();
              const assigneeName =
                task?.assignee?.name ?? task?.assignee_name ?? task?.assigned_to ?? 'Unassigned';
              const assigneeAvatar = task?.assignee?.avatarUrl ?? task?.assignee?.avatar ?? '';

              return {
                id,
                title: task?.title ?? task?.name ?? 'Untitled Task',
                subtitle: task?.subtitle ?? task?.description ?? '',
                project: projectName,
                client: clientName,
                dueISO: new Date(due).toISOString(),
                assignee: { name: assigneeName, avatarUrl: assigneeAvatar },
                emailReminder: !!(task?.emailReminder ?? task?.email_reminder ?? false),
                attachmentsCount:
                  Number(task?.attachmentsCount ?? task?.attachments_count ?? 0) || 0,
                commentsCount: Number(task?.commentsCount ?? task?.comments_count ?? 0) || 0,
                tags: Array.isArray(task?.tags) ? task.tags : [],
                status: this.mapTaskStatus(task?.status ?? 'upcoming'),
              };
            }
          );

          this.tasks.set(mappedTasks);
          this.isLoading.set(false);
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error fetching tasks:', error);
          this.error.set(this.parseHttpError(error));
          this.tasks.set([]);
          this.isLoading.set(false);
          this.cdr.detectChanges();
        },
      });
  }

  private parseHttpError(err: any): string {
    try {
      // Angular HttpErrorResponse common shapes
      if (err?.error) {
        const e = err.error;
        if (typeof e === 'string') return e;
        if (e?.message) return String(e.message);
        if (e?.error) return String(e.error);
        // try stringify
        return JSON.stringify(e);
      }
      if (err?.message) return String(err.message);
      return 'An unexpected error occurred while processing the request.';
    } catch {
      return 'An unexpected error occurred while processing the request.';
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  } // Map API status to our TaskStatus type
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

  trackByTaskId(index: number, task: TaskItem): string {
    return task.id;
  }

  // Modal state and form
  showTaskModal = signal(false);
  taskMode = signal<'create' | 'edit' | 'view'>('create');
  currentTask = signal<TaskItem | null>(null);

  createTaskForm = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.minLength(2)]],
    description: [''],
    projectId: ['', [Validators.required]],
    priority: ['Medium'],
    dueDate: [''],
    dueTime: [''],
    assigneeId: [''],
    assignee: [''], // optional manual fallback
    emailReminder: [false],
    notifyClient: [false],
  });

  openCreate() {
    this.taskMode.set('create');
    this.currentTask.set(null);
    const today = new Date();
    const yyyyMMdd = today.toISOString().slice(0, 10);
    this.createTaskForm.reset({
      title: '',
      description: '',
      projectId: this.projectOptions()[0]?.id || '',
      priority: 'Medium',
      dueDate: yyyyMMdd,
      dueTime: '09:00',
      assigneeId: this.assigneeOptions()[0]?.id || '',
      assignee: '',
      emailReminder: false,
      notifyClient: false,
    });
    this.showTaskModal.set(true);
  }
  openEdit(task: TaskItem) {
    this.taskMode.set('edit');
    this.currentTask.set(task);
    const d = new Date(task.dueISO);
    const yyyyMMdd = d.toISOString().slice(0, 10);
    const hhmm = d.toTimeString().slice(0, 5);
    // Try to resolve project id by matching the name (best-effort)
    const proj = this.projectOptions().find((p) => p.name === (task.project || ''));
    this.createTaskForm.patchValue({
      title: task.title,
      description: task.subtitle || '',
      projectId: proj?.id || '',
      priority: 'Medium',
      dueDate: yyyyMMdd,
      dueTime: hhmm,
      assigneeId:
        this.assigneeOptions().find((a) => a.name === (task.assignee?.name || ''))?.id || '',
      assignee: task.assignee?.name || '',
      emailReminder: !!task.emailReminder,
      notifyClient: false,
    });
    this.showTaskModal.set(true);
  }
  openView(task: TaskItem) {
    this.taskMode.set('view');
    this.currentTask.set(task);
    this.showTaskModal.set(true);
  }
  closeTaskModal() {
    this.showTaskModal.set(false);
  }

  submitTask() {
    if (this.createTaskForm.invalid) return;
    this.submitError.set(null);
    this.isSubmitting.set(true);

    const v = this.createTaskForm.getRawValue();
    const date = v.dueDate
      ? new Date(v.dueDate + (v.dueTime ? 'T' + v.dueTime : 'T09:00'))
      : new Date();
    const dueISO = date.toISOString();
    // Optional simple validation: prevent past dates (except today)
    const now = new Date();
    if (v.dueDate) {
      const dueOnly = new Date(v.dueDate);
      dueOnly.setHours(0, 0, 0, 0);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (dueOnly < today) {
        this.submitError.set('Due date cannot be in the past.');
        this.isSubmitting.set(false);
        this.cdr.detectChanges();
        return;
      }
    }

    if (this.taskMode() === 'edit' && this.currentTask()) {
      // For now, local update only; wire PATCH later once backend contract is ready
      const orig = this.currentTask()!;
      const updated: TaskItem = {
        ...orig,
        title: v.title,
        subtitle: v.description || '',
        project: this.projectOptions().find((p) => p.id === v.projectId)?.name || orig.project,
        dueISO,
        assignee: {
          name:
            this.assigneeOptions().find((a) => a.id === v.assigneeId)?.name ||
            v.assignee ||
            'Unassigned',
          avatarUrl: orig.assignee?.avatarUrl,
        },
        emailReminder: !!v.emailReminder,
        tags: orig.tags,
      };
      this.tasks.update((list) => list.map((t) => (t.id === orig.id ? updated : t)));
      this.isSubmitting.set(false);
      this.closeTaskModal();
      return;
    }

    // Build minimal backend payload for create (avoid forbidden fields)
    const basePayload: Record<string, unknown> = {
      title: v.title,
      description: v.description || undefined,
      project_id: v.projectId,
      due_time: dueISO,
    };
    if (v.assigneeId) basePayload['assignee_id'] = v.assigneeId; // Only send id; do not send assignee_name
    if (v.emailReminder) basePayload['email_reminder'] = true; // Optional; will be stripped on retry if rejected
    // Do NOT send notify_client or status; priority omitted unless required by backend

    const doCreate = (payload: Record<string, unknown>, didRetry = false) => {
      this.taskService
        .createTask(payload)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            // Refresh tasks from server and close modal
            this.taskService.invalidateCache();
            this.loadTasks();
            this.isSubmitting.set(false);
            this.closeTaskModal();
          },
          error: (err) => {
            // If 400 with messages like "property X should not exist", strip and retry once
            const msgs: string[] | undefined = Array.isArray(err?.error?.message)
              ? err.error.message
              : undefined;
            if (err?.status === 400 && msgs && !didRetry) {
              const forbidden = msgs
                .map((m) => {
                  const match = /property\s+([^\s]+)\s+should not exist/i.exec(m);
                  return match ? match[1] : undefined;
                })
                .filter(Boolean) as string[];
              if (forbidden.length) {
                const sanitized: Record<string, unknown> = { ...payload };
                for (const key of forbidden) delete sanitized[key];
                // Also guard against id/uuid if server complains generically
                delete (sanitized as any).id;
                delete (sanitized as any).uuid;
                return doCreate(sanitized, true);
              }
            }
            this.submitError.set(this.parseHttpError(err));
            this.isSubmitting.set(false);
            this.cdr.detectChanges();
          },
        });
    };

    doCreate(basePayload);
  }

  // (removed) Old computed projectOptions (names only) replaced by id+name options loaded from backend
}
