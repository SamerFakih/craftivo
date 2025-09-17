import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TaskItem } from '../../models/tasks';

@Component({
  selector: 'app-task-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './task-card.html',
  styleUrls: ['./task-card.css'],
})
export class TaskCard {
  @Input() task!: TaskItem;
  @Output() view = new EventEmitter<TaskItem>();
  @Output() edit = new EventEmitter<TaskItem>();

  get dateLabel(): string {
    const d = new Date(this.task.dueISO);
    const date = d.toLocaleDateString(undefined, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const time = d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
    return `${date} at ${time}`;
  }

  onView(event?: Event) {
    event?.stopPropagation();
    this.view.emit(this.task);
  }
  onEdit(event?: Event) {
    event?.stopPropagation();
    this.edit.emit(this.task);
  }
}
