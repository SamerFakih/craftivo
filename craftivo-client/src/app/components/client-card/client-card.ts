import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClientModel } from '../../models/client';

@Component({
  selector: 'app-client-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './client-card.html',
  styleUrls: ['./client-card.css'],
})
export class ClientCard {
  @Input({ required: true }) client!: ClientModel;

  pillClass() {
    return this.client.status === 'active' ? 'pill pill--active' : 'pill pill--inactive';
  }

  money(n: number) {
    return n.toLocaleString(undefined, { maximumFractionDigits: 0 });
  }
}
