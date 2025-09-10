import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Project } from '../../models/project';
import { ProgressBarModule } from 'primeng/progressbar';

@Component({
  selector: 'app-project-card',
  standalone: true,
  imports: [CommonModule, ProgressBarModule],
  templateUrl: './project-card.html',
  styleUrls: ['./project-card.css'],
})
export class ProjectCard {
  @Input() project!: Project;

  value: number = 70;

  get dueDateLabel(): string {
    const d = new Date(this.project.dueDateISO);
    return d.toLocaleDateString(undefined, { year: 'numeric', month: '2-digit', day: '2-digit' });
  }

  get progressStyle() {
    return { width: `${Math.min(Math.max(this.project.progressPct, 0), 100)}%` };
  }
}
