import { Component, Input, Output, EventEmitter } from '@angular/core';
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
  @Output() view = new EventEmitter<Project>();
  @Output() edit = new EventEmitter<Project>();

  value: number = 70;

  get dueDateLabel(): string {
    const d = new Date(this.project.end_date);
    return d.toLocaleDateString(undefined, { year: 'numeric', month: '2-digit', day: '2-digit' });
  }

  get progressStyle() {
    return { width: `${Math.min(Math.max(this.project.progress, 0), 100)}%` };
  }

  onView(event?: Event) {
    event?.stopPropagation();
    this.view.emit(this.project);
  }
  onEdit(event?: Event) {
    event?.stopPropagation();
    this.edit.emit(this.project);
  }
}
