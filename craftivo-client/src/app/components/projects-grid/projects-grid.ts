import { Component, computed, signal, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProjectCard } from '../project-card/project-card';
import { ProjectService } from '../../services/project.service';
import { Project } from '../../models/project';
import { Subject, takeUntil } from 'rxjs';

type TabKey = 'all' | 'active' | 'completed' | 'other';

@Component({
  selector: 'app-projects-grid',
  standalone: true,
  imports: [CommonModule, ProjectCard],
  templateUrl: './projects-grid.html',
  styleUrls: ['./projects-grid.css'],
})
export class ProjectsGrid implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  constructor(private projectService: ProjectService, private cdr: ChangeDetectorRef) {}
  ngOnInit() {
    this.isLoading.set(true);
    this.error.set(null);

    this.projectService
      .getProjects()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          // The API returns projects array directly, not wrapped in data.projects
          const projectsArray = Array.isArray(data) ? data : data.projects || [];

          if (Array.isArray(projectsArray) && projectsArray.length > 0) {
            const mappedProjects: Project[] = projectsArray.map((pr: any): Project => {
              return {
                ...pr,
                budget: Number(pr.budget),
                hourly_rate: Number(pr.hourly_rate),
                spent_amount: Number(pr.spent_amount),
                client: pr.clients?.name || '',
                team: (pr.project_members || []).map((m: any) => ({
                  name: `${m.users?.first_name || ''} ${m.users?.last_name || ''}`.trim(),
                  avatarUrl: m.users?.profile_image || 'https://via.placeholder.com/28',
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
  isLoading = signal(false);
  error = signal<string | null>(null);

  activeTab = signal<TabKey>('all');

  filtered = computed(() => {
    const tab = this.activeTab();
    if (tab === 'all') return this.projects();
    return this.projects().filter((p) => p.status === tab);
  });

  // PRECOMPUTED lists & counts (no arrow functions in template)
  allList = computed(() => this.projects());
  activeList = computed(() => this.projects().filter((p) => p.status === 'active'));
  completedList = computed(() => this.projects().filter((p) => p.status === 'completed'));
  otherList = computed(() => this.projects().filter((p) => p.status === 'other'));

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
  totalCount = computed(() => this.projects().length);
  activeCountt = computed(() => this.projects().filter((p) => p.status === 'active').length);
  completedCountt = computed(() => this.projects().filter((p) => p.status === 'completed').length);
  totalRevenue = computed(() => {
    // sum of spent_amount; adjust to budget if you want total budget
    return this.projects().reduce((sum, p) => sum + Number(p.spent_amount || 0), 0);
  });

  setTab(tab: TabKey) {
    this.activeTab.set(tab);
  }

  trackByProjectId(index: number, project: Project): number {
    return project.id;
  }
}
