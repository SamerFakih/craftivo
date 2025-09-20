import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MemberSummary } from '../../models/time-tracking';

@Component({
  selector: 'app-team-overview',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './team-overview.html',
  styleUrls: ['./team-overview.css'],
})
export class TeamOverview {
  @Input({ required: true }) members: MemberSummary[] = [];
}
