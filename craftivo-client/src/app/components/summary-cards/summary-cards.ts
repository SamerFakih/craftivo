import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-summary-cards',
  imports: [CommonModule],
  templateUrl: './summary-cards.html',
  styleUrl: './summary-cards.css',
  standalone: true,
})
export class SummaryCards {
  @Input() summarys: { key: string; value: number; icon: string }[] = [];
}
