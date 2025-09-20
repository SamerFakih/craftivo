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
  q = signal('');
  onSearchInput(event: Event) {
    const input = event.target as HTMLInputElement;
    this.q.set(input.value);
  }
}
