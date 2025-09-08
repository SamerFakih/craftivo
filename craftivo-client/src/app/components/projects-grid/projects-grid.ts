import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Project } from '../../models/project';
import { ProjectCard } from '../project-card/project-card';

type TabKey = 'all' | 'active' | 'completed' | 'other';

@Component({
  selector: 'app-projects-grid',
  standalone: true,
  imports: [CommonModule, ProjectCard],
  templateUrl: './projects-grid.html',
  styleUrls: ['./projects-grid.css'],
})
export class ProjectsGrid {
  // Demo data — replace with API data
  projects = signal<Project[]>([
    {
      id: '1',
      title: 'E-commerce Website Redesign',
      client: 'TechCorp Inc.',
      description: "Complete redesign of the company's e-commerce platform",
      status: 'active',
      progressPct: 75,
      budgetUsed: 9000,
      budgetTotal: 12000,
      dueDateISO: '2024-09-15',
      team: [{ name: 'A' }, { name: 'B' }, { name: 'C' }, { name: 'D' }],
      tags: ['Web Design', 'E-commerce'],
      progress: function (progress: any, arg1: number): number {
        throw new Error('Function not implemented.');
      },
    },
    // Duplicate a few for layout like screenshot
    {
      id: '2',
      title: 'E-commerce Website Redesign',
      client: 'TechCorp Inc.',
      description: "Complete redesign of the company's e-commerce platform",
      status: 'active',
      progressPct: 75,
      budgetUsed: 9000,
      budgetTotal: 12000,
      dueDateISO: '2024-09-15',
      team: [{ name: 'A' }, { name: 'B' }, { name: 'C' }],
      tags: ['Web Design', 'E-commerce'],
      progress: function (progress: any, arg1: number): number {
        throw new Error('Function not implemented.');
      },
    },
    {
      id: '3',
      title: 'E-commerce Website Redesign',
      client: 'TechCorp Inc.',
      description: "Complete redesign of the company's e-commerce platform",
      status: 'active',
      progressPct: 75,
      budgetUsed: 9000,
      budgetTotal: 12000,
      dueDateISO: '2024-09-15',
      team: [{ name: 'A' }, { name: 'B' }],
      tags: ['Web Design', 'E-commerce'],
      progress: function (progress: any, arg1: number): number {
        throw new Error('Function not implemented.');
      },
    },
    {
      id: '4',
      title: 'E-commerce Website Redesign',
      client: 'TechCorp Inc.',
      description: "Complete redesign of the company's e-commerce platform",
      status: 'active',
      progressPct: 75,
      budgetUsed: 9000,
      budgetTotal: 12000,
      dueDateISO: '2024-09-15',
      team: [{ name: 'A' }, { name: 'B' }, { name: 'C' }],
      tags: ['Web Design', 'E-commerce'],
      progress: function (progress: any, arg1: number): number {
        throw new Error('Function not implemented.');
      },
    },
    {
      id: '5',
      title: 'E-commerce Website Redesign',
      client: 'TechCorp Inc.',
      description: "Complete redesign of the company's e-commerce platform",
      status: 'active',
      progressPct: 75,
      budgetUsed: 9000,
      budgetTotal: 12000,
      dueDateISO: '2024-09-15',
      team: [{ name: 'A' }],
      tags: ['Web Design', 'E-commerce'],
      progress: function (progress: any, arg1: number): number {
        throw new Error('Function not implemented.');
      },
    },
    {
      id: '6',
      title: 'E-commerce Website Redesign',
      client: 'TechCorp Inc.',
      description: "Complete redesign of the company's e-commerce platform",
      status: 'active',
      progressPct: 75,
      budgetUsed: 9000,
      budgetTotal: 12000,
      dueDateISO: '2024-09-15',
      team: [{ name: 'A' }, { name: 'B' }, { name: 'C' }],
      tags: ['Web Design', 'E-commerce'],
      progress: function (progress: any, arg1: number): number {
        throw new Error('Function not implemented.');
      },
    },
  ]);

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
    // sum of budgetUsed; adjust to budgetTotal if you want
    return this.projects().reduce((sum, p) => sum + (p.budgetUsed || 0), 0);
  });

  setTab(tab: TabKey) {
    this.activeTab.set(tab);
  }
}
