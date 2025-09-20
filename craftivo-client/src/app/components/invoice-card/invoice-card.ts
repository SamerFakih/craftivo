import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InvoiceModel } from '../../models/invoice';

@Component({
  selector: 'app-invoice-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './invoice-card.html',
  styleUrls: ['./invoice-card.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InvoiceCard {
  @Input() invoice!: InvoiceModel;
  @Output() view = new EventEmitter<InvoiceModel>();
  @Output() edit = new EventEmitter<InvoiceModel>();

  get amtLabel() {
    return this.invoice.amountUSD.toLocaleString(undefined, { maximumFractionDigits: 0 });
  }
  get issued() {
    return new Date(this.invoice.issuedISO).toLocaleDateString();
  }
  get due() {
    return new Date(this.invoice.dueISO).toLocaleDateString();
  }
  get paid() {
    return this.invoice.paidISO ? new Date(this.invoice.paidISO).toLocaleDateString() : null;
  }

  pillClass() {
    switch (this.invoice.status) {
      case 'paid':
        return 'pill pill--paid';
      case 'pending':
        return 'pill pill--pending';
      default:
        return 'pill pill--overdue';
    }
  }

  onView(e: MouseEvent) {
    e.stopPropagation();
    this.view.emit(this.invoice);
  }
  onEdit(e: MouseEvent) {
    e.stopPropagation();
    this.edit.emit(this.invoice);
  }
}
