import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProjectHoursCard } from '../../models/time-tracking';

@Component({
  selector: 'app-project-summary',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './project-summary.html',
  styleUrls: ['./project-summary.css'],
})
export class ProjectSummary {
  @Input({ required: true }) cards: ProjectHoursCard[] = [];
}
