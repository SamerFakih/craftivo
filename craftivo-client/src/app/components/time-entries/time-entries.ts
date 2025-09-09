import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TimeEntry } from '../../models/time-tracking';

@Component({
  selector: 'app-time-entries',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './time-entries.html',
  styleUrls: ['./time-entries.css'],
})
export class TimeEntries {
  @Input({ required: true }) entries: TimeEntry[] = [];
}
