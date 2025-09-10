import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-summary-cards',
  imports: [],
  templateUrl: './summary-cards.html',
  styleUrl: './summary-cards.css',
  standalone: true,
})
export class SummaryCards {
  @Input() key!: string;
  @Input() value!: number;
  @Input() icon!: string;
}
