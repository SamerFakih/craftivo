import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TimeEntry } from '../../models/time-tracking';

@Component({
  selector: 'app-time-entries',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './time-entries.html',
  styleUrls: ['./time-entries.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TimeEntries {
  @Input({ required: true }) entries: TimeEntry[] = [];
  @Output() manual = new EventEmitter<void>();
  @Output() edit = new EventEmitter<TimeEntry>();
  @Output() delete = new EventEmitter<string>();

  onEdit(entry: TimeEntry) {
    this.edit.emit(entry);
  }
  onDelete(id: string) {
    this.delete.emit(id);
  }
}
