import {
  Component,
  computed,
  signal,
  OnInit,
  OnDestroy,
  ChangeDetectorRef,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProjectCard } from '../project-card/project-card';
import { ProjectService } from '../../services/project.service';
import { Project } from '../../models/project';
import { ClientService } from '../../services/client.service';
import { Subject, takeUntil } from 'rxjs';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { TaskService } from '../../services/task.service';

type TabKey = 'all' | 'active' | 'completed' | 'other';

@Component({
  selector: 'app-projects-grid',
  standalone: true,
  imports: [CommonModule, ProjectCard, ReactiveFormsModule],
  templateUrl: './projects-grid.html',
  styleUrls: ['./projects-grid.css'],
})
export class ProjectsGrid implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private fb = inject(FormBuilder);

  constructor(
    private projectService: ProjectService,
    private cdr: ChangeDetectorRef,
    private clientService: ClientService,
    private taskService: TaskService
  ) {}
  ngOnInit() {
    this.isLoading.set(true);
    this.error.set(null);

    // Load tasks first for progress calculation (independent streams)
    this.taskService
      .getTasks()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (tasks) => {
          this._rawTasks.set(Array.isArray(tasks) ? tasks : tasks?.tasks || []);
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.warn('Failed to load tasks for progress computation', err);
          this._rawTasks.set([]);
        },
      });

    // Load clients for the client select
    this.clientService
      .getClients()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (clients) => {
          const options = (clients || [])
            .map((c: any) => ({ id: Number(c.id), name: c.name }))
            .filter((c) => Number.isFinite(c.id) && c.id > 0);
          this.clientsOptions.set(options);
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error loading clients for select:', err);
        },
      });

    this.projectService
      .getProjects()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          // The API returns projects array directly, not wrapped in data.projects
          const projectsArray = Array.isArray(data) ? data : data.projects || [];

          if (Array.isArray(projectsArray) && projectsArray.length > 0) {
            const mappedProjects: Project[] = projectsArray.map((pr: any): Project => {
              const clientName =
                pr.clients?.name || pr.client?.name || pr.client_name || pr.clientName || '';
              return {
                ...pr,
                budget: Number(pr.budget),
                hourly_rate: Number(pr.hourly_rate),
                spent_amount: Number(pr.spent_amount),
                client: clientName,
                team: (pr.project_members || []).map((m: any) => ({
                  name: `${m.users?.first_name || ''} ${m.users?.last_name || ''}`.trim(),
                  avatarUrl: m.users?.profile_image || '/assets/craftivo-logo.png',
                })),
              };
            });

            this.projects.set(mappedProjects);
            this.cdr.detectChanges(); // Manually trigger change detection
          } else {
            this.projects.set([]);
          }

          this.isLoading.set(false);
          this.cdr.detectChanges(); // Ensure loading state updates
        },
        error: (error) => {
          console.error('Error fetching projects:', error);
          this.error.set('Failed to load projects. Please try again.');
          this.projects.set([]);
          this.isLoading.set(false);
          this.cdr.detectChanges(); // Ensure error state updates
        },
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
  projects = signal<Project[]>([]);
  // Raw tasks for progress computation (API shape might vary)
  private _rawTasks = signal<any[]>([]);

  // Helper: compute progress per project id based on tasks
  private _progressMap = computed(() => {
    const tasks = this._rawTasks();
    if (!tasks || tasks.length === 0) return new Map<number, number>();
    const map = new Map<number, { total: number; done: number }>();
    for (const t of tasks) {
      // Accept multiple possible field names for project id + status
      const pid = Number(
        t.project_id || t.projectId || t.project_id_fk || t.project?.id || t.projects?.id
      );
      if (!Number.isFinite(pid) || pid <= 0) continue;
      const status = (t.status || t.state || '').toString().toLowerCase();
      const bucket = map.get(pid) || { total: 0, done: 0 };
      bucket.total += 1;
      if (status === 'completed' || status === 'done' || status === 'finished') bucket.done += 1;
      map.set(pid, bucket);
    }
    const result = new Map<number, number>();
    map.forEach((v, k) => {
      if (v.total === 0) return; // skip zero total (shouldn't happen once in map)
      result.set(k, Math.round((v.done / v.total) * 100));
    });
    return result;
  });

  // Enriched projects with computed progress overriding backend progress when we have tasks
  enrichedProjects = computed<Project[]>(() => {
    const base = this.projects();
    const progressMap = this._progressMap();
    if (!progressMap.size) return base;
    return base.map((p) => {
      const override = progressMap.get(p.id);
      if (override == null) return p;
      return { ...p, progress: override };
    });
  });
  clientsOptions = signal<Array<{ id: number; name: string }>>([]);
  isLoading = signal(false);
  error = signal<string | null>(null);
  isSubmitting = signal(false);
  submitError = signal<string | null>(null);

  activeTab = signal<TabKey>('all');

  filtered = computed(() => {
    const tab = this.activeTab();
    const list = this.enrichedProjects();
    if (tab === 'all') return list;
    return list.filter((p) => p.status === tab);
  });

  // PRECOMPUTED lists & counts (no arrow functions in template)
  allList = computed(() => this.enrichedProjects());
  activeList = computed(() => this.enrichedProjects().filter((p) => p.status === 'active'));
  completedList = computed(() => this.enrichedProjects().filter((p) => p.status === 'completed'));
  otherList = computed(() => this.enrichedProjects().filter((p) => p.status === 'other'));

  allCount = computed(() => this.allList().length);
  activeCount = computed(() => this.activeList().length);
  completedCount = computed(() => this.completedList().length);
  otherCount = computed(() => this.otherList().length);

  // What the grid actually shows
  filter = computed(() => {
    switch (this.activeTab()) {
      case 'active':
        return this.activeList();
      case 'completed':
        return this.completedList();
      case 'other':
        return this.otherList();
      default:
        return this.allList();
    }
  });

  // search
  q = signal('');
  onSearchInput(event: Event) {
    const input = event.target as HTMLInputElement;
    this.q.set(input.value);
  }
  // derived
  totalCount = computed(() => this.enrichedProjects().length);
  activeCountt = computed(
    () => this.enrichedProjects().filter((p) => p.status === 'active').length
  );
  completedCountt = computed(
    () => this.enrichedProjects().filter((p) => p.status === 'completed').length
  );
  totalRevenue = computed(() => {
    // sum of spent_amount; adjust to budget if you want total budget
    return this.enrichedProjects().reduce((sum, p) => sum + Number(p.spent_amount || 0), 0);
  });

  setTab(tab: TabKey) {
    this.activeTab.set(tab);
  }

  trackByProjectId(index: number, project: Project): number {
    return project.id;
  }

  // Modal state and form (create/edit/view)
  showProjectModal = signal(false);
  modalMode = signal<'create' | 'edit' | 'view'>('create');
  currentProject = signal<Project | null>(null);
  createForm = this.fb.nonNullable.group({
    projectName: ['', [Validators.required, Validators.minLength(2)]],
    // Keep clientName optional for display/autocomplete if needed (not required)
    clientName: [''],
    // Require clientId to be selected from the dropdown
    clientId: [0, [Validators.required, Validators.min(1)]],
    description: [''],
    budget: [5000, [Validators.required, Validators.min(0)]],
    startDate: [''],
    dueDate: [''],
    status: ['active' as 'active' | 'completed' | 'other'],
    tags: [''],
    // Additional backend fields (optional UI)
    priority: ['normal'],
    hourlyRate: [0, [Validators.min(0)]],
    currency: ['USD'],
    billingType: ['fixed'],
    progress: [0, [Validators.min(0), Validators.max(100)]],
    spentAmount: [0, [Validators.min(0)]],
    active: [true],
  });

  openCreate() {
    this.modalMode.set('create');
    this.currentProject.set(null);
    this.submitError.set(null);
    this.createForm.reset({
      projectName: '',
      clientName: '',
      clientId: 0,
      description: '',
      budget: 5000,
      startDate: '',
      dueDate: '',
      status: 'active',
      tags: '',
      priority: 'normal',
      hourlyRate: 0,
      currency: 'USD',
      billingType: 'fixed',
      progress: 0,
      spentAmount: 0,
      active: true,
    });
    // Ensure clientId is enabled for create
    this.createForm.get('clientId')?.enable({ emitEvent: false });
    this.showProjectModal.set(true);
  }

  openEdit(project: Project) {
    this.modalMode.set('edit');
    this.currentProject.set(project);
    // eslint-disable-next-line no-console
    console.log('Open Edit modal for', project);
    const effectiveClientId =
      Number((project as any).client_id || (project as any).clients?.id) || 0;
    const fallbackName =
      (project as any).clients?.name ||
      this.clientsOptions().find((c) => c.id === effectiveClientId)?.name ||
      '';
    this.createForm.patchValue({
      projectName: project.name,
      clientName: project.client || fallbackName,
      clientId: effectiveClientId,
      description: project.description || '',
      budget: Number(project.budget) || 0,
      startDate: project.start_date ? project.start_date.substring(0, 10) : '',
      dueDate: project.end_date ? project.end_date.substring(0, 10) : '',
      status: project.status,
      tags: '',
      priority: (project.priority as any) || 'normal',
      hourlyRate: Number(project.hourly_rate) || 0,
      currency: project.currency || 'USD',
      billingType: project.billing_type || 'fixed',
      progress: Number(project.progress) || 0,
      spentAmount: Number(project.spent_amount) || 0,
      active: !!project.active,
    });
    // Disable clientId selection in edit mode to avoid unauthorized client changes
    this.createForm.get('clientId')?.disable({ emitEvent: false });
    this.submitError.set(null);
    this.showProjectModal.set(true);
  }

  openView(project: Project) {
    this.modalMode.set('view');
    this.currentProject.set(project);
    // eslint-disable-next-line no-console
    console.log('Open View modal for', project);
    this.showProjectModal.set(true);
  }

  closeModal() {
    this.showProjectModal.set(false);
  }

  // Helper to extract meaningful error message from HttpErrorResponse
  private setSubmitErrorFromHttp(err: any, fallback: string) {
    const setMsg = (msg: string) => this.submitError.set(msg || fallback);
    if (!err) return setMsg(fallback);
    // Prefer JSON message
    const body = err.error;
    if (body && typeof body === 'object' && !(body instanceof Blob)) {
      const msg = body.message || body.error || err.message || fallback;
      return setMsg(msg);
    }
    // If backend sent plain text
    if (typeof body === 'string') {
      return setMsg(body);
    }
    // If backend sent Blob (e.g., HTML error page)
    if (body instanceof Blob) {
      const reader = new FileReader();
      reader.onload = () => {
        const text = String(reader.result || '');
        try {
          const j = JSON.parse(text);
          setMsg(j.message || j.error || text || fallback);
        } catch {
          setMsg(text || fallback);
        }
      };
      reader.onerror = () => setMsg(fallback);
      reader.readAsText(body);
      return;
    }
    // Fallback to status text
    setMsg(err.statusText || fallback);
  }

  submitProject() {
    if (this.createForm.invalid) return;
    const v = this.createForm.getRawValue();
    const mode = this.modalMode();
    this.submitError.set(null);

    // Basic validations that backend is likely to require
    if (!v.clientId || Number(v.clientId) < 1) {
      this.submitError.set('Please select a client.');
      return;
    }
    if (mode === 'create' && (!v.startDate || !v.dueDate)) {
      this.submitError.set('Please provide both Start Date and Due Date.');
      return;
    }
    // Map UI form values to backend payload (create: keep minimal fields to avoid 400s)
    const isValidBilling = (bt: string) => ['fixed', 'hourly'].includes((bt || '').toLowerCase());
    const isValidStatus = (s: string) =>
      ['active', 'completed', 'other'].includes((s || '').toLowerCase());

    const toCreatePayload = () => {
      const base: any = {
        name: v.projectName,
        description: v.description || '',
        client_id: Number(v.clientId) || 0,
        start_date: v.startDate,
        end_date: v.dueDate,
        budget: Number(v.budget) || 0,
      };
      // Include all expected fields with safe defaults
      base.status = isValidStatus(v.status) ? v.status : 'active';
      base.billing_type = isValidBilling(v.billingType) ? v.billingType.toLowerCase() : 'fixed';
      base.currency = v.currency || 'USD';
      base.hourly_rate = Number(v.hourlyRate) || 0;
      base.progress = Number(v.progress) || 0;
      base.spent_amount = Number(v.spentAmount) || 0;
      base.active = typeof v.active === 'boolean' ? !!v.active : true;
      base.priority = v.priority || 'normal';
      return base;
    };

    const toUpdatePayload = (orig: Project) => {
      const patch: any = {};
      const toYMD = (s?: string) => (s ? s.substring(0, 10) : '');
      const eqNum = (a: any, b: any) => Number(a || 0) === Number(b || 0);
      const origClientId = Number((orig as any).client_id || (orig as any).clients?.id || 0);

      // name
      if ((v.projectName || '') !== (orig.name || '')) patch.name = v.projectName;
      // description
      if ((v.description || '') !== (orig.description || ''))
        patch.description = v.description || '';
      // client_id: do not allow changing client on update to avoid permission issues
      // dates
      if ((v.startDate || '') !== toYMD(orig.start_date)) patch.start_date = v.startDate || '';
      if ((v.dueDate || '') !== toYMD(orig.end_date)) patch.end_date = v.dueDate || '';
      // budget
      if (!eqNum(v.budget, orig.budget)) patch.budget = Number(v.budget) || 0;
      // status
      if (isValidStatus(v.status) && (v.status || '') !== (orig.status || ''))
        patch.status = v.status;
      // billing_type
      if (isValidBilling(v.billingType) && (v.billingType || '') !== (orig.billing_type || ''))
        patch.billing_type = v.billingType.toLowerCase();
      // currency
      if ((v.currency || '') !== (orig.currency || '')) patch.currency = v.currency || 'USD';
      // hourly_rate
      if (!eqNum(v.hourlyRate, orig.hourly_rate)) patch.hourly_rate = Number(v.hourlyRate) || 0;
      // progress
      if (!eqNum(v.progress, orig.progress)) patch.progress = Number(v.progress) || 0;
      // spent_amount
      if (!eqNum(v.spentAmount, orig.spent_amount)) patch.spent_amount = Number(v.spentAmount) || 0;
      // active
      if (typeof v.active === 'boolean' && Boolean(v.active) !== Boolean(orig.active))
        patch.active = !!v.active;
      // priority (only if orig has it and changed)
      const origPriority = (orig as any).priority ?? '';
      if ((v.priority || '') !== (origPriority || '')) patch.priority = v.priority || 'normal';

      return patch;
    };

    const performUpdate = (payload: any) => {
      this.isSubmitting.set(true);
      if (mode === 'edit' && this.currentProject()) {
        const original = this.currentProject()!;
        // Do NOT include id/uuid in body (backend rejects these)
        // eslint-disable-next-line no-console
        console.log('Updating project payload:', original.id, payload);
        this.projectService.updateProject(original.id, payload).subscribe({
          next: () => {
            // Refresh list via cache invalidation and reload
            this.projectService.invalidateCache();
            this.projectService
              .getProjects()
              .pipe(takeUntil(this.destroy$))
              .subscribe({
                next: (data) => {
                  const projectsArray = Array.isArray(data) ? data : data.projects || [];
                  const mappedProjects: Project[] = (projectsArray || []).map((pr: any) => {
                    const clientName =
                      pr.clients?.name || pr.client?.name || pr.client_name || pr.clientName || '';
                    return {
                      ...pr,
                      budget: Number(pr.budget),
                      hourly_rate: Number(pr.hourly_rate),
                      spent_amount: Number(pr.spent_amount),
                      client: clientName,
                      team: (pr.project_members || []).map((m: any) => ({
                        name: `${m.users?.first_name || ''} ${m.users?.last_name || ''}`.trim(),
                        avatarUrl: m.users?.profile_image || '/assets/craftivo-logo.png',
                      })),
                    };
                  });
                  this.projects.set(mappedProjects);
                  this.isSubmitting.set(false);
                  this.closeModal();
                  this.cdr.detectChanges();
                },
                error: (err) => {
                  this.isSubmitting.set(false);
                  this.submitError.set(
                    err?.error?.message || 'Failed to refresh projects after update.'
                  );
                },
              });
          },
          error: (err) => {
            this.isSubmitting.set(false);
            this.setSubmitErrorFromHttp(err, 'Failed to update project.');
            // eslint-disable-next-line no-console
            console.error('Update project failed:', err);
          },
        });
      } else {
        this.projectService.createProject(payload).subscribe({
          next: () => {
            this.projectService.invalidateCache();
            this.projectService
              .getProjects()
              .pipe(takeUntil(this.destroy$))
              .subscribe({
                next: (data) => {
                  const projectsArray = Array.isArray(data) ? data : data.projects || [];
                  const mappedProjects: Project[] = (projectsArray || []).map((pr: any) => {
                    const clientName =
                      pr.clients?.name || pr.client?.name || pr.client_name || pr.clientName || '';
                    return {
                      ...pr,
                      budget: Number(pr.budget),
                      hourly_rate: Number(pr.hourly_rate),
                      spent_amount: Number(pr.spent_amount),
                      client: clientName,
                      team: (pr.project_members || []).map((m: any) => ({
                        name: `${m.users?.first_name || ''} ${m.users?.last_name || ''}`.trim(),
                        avatarUrl: m.users?.profile_image || '/assets/craftivo-logo.png',
                      })),
                    };
                  });
                  this.projects.set(mappedProjects);
                  this.isSubmitting.set(false);
                  this.closeModal();
                  this.cdr.detectChanges();
                },
                error: (err) => {
                  this.isSubmitting.set(false);
                  this.submitError.set(
                    err?.error?.message || 'Failed to refresh projects after create.'
                  );
                },
              });
          },
          error: (err) => {
            this.isSubmitting.set(false);
            this.setSubmitErrorFromHttp(err, 'Failed to create project.');
            // eslint-disable-next-line no-console
            console.error('Create project failed. Payload:', payload, 'Error:', err);
          },
        });
      }
    };

    // Additional date order validation
    const sDate = v.startDate ? new Date(v.startDate) : null;
    const eDate = v.dueDate ? new Date(v.dueDate) : null;
    if (sDate && eDate && eDate.getTime() < sDate.getTime()) {
      this.submitError.set('Due Date must be after Start Date.');
      return;
    }

    // Proceed directly with the selected client_id
    const payload = mode === 'edit' ? toUpdatePayload(this.currentProject()!) : toCreatePayload();
    // eslint-disable-next-line no-console
    console.log('Submitting project payload:', payload);
    performUpdate(payload);
  }
}
