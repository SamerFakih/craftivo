import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProjectsGrid } from '../components/projects-grid/projects-grid';

@Component({
  selector: 'app-project',
  imports: [CommonModule, ProjectsGrid],
  templateUrl: './project.html',
  styleUrl: './project.css',
  standalone: true,
})
export class Project {
  summarys = [
    { key: 'Total Projects', value: 10, icon: 'pi pi-briefcase' },
    { key: 'Active', value: 5, icon: 'pi pi-check-circle' },
    { key: 'Completed', value: 3, icon: 'pi pi-check' },
    { key: 'Total Revenue', value: 2, icon: 'pi pi-dollar' },
  ];

  q = signal('');
  onSearchInput(event: Event) {
    const input = event.target as HTMLInputElement;
    this.q.set(input.value);
  }
}
