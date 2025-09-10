import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InvoiceModel, InvoiceStatus } from '../models/invoice';
import { InvoiceCard } from '../components/invoice-card/invoice-card';

type TabKey = 'all' | 'paid' | 'pending' | 'overdue';

@Component({
  selector: 'app-invoices-page',
  standalone: true,
  imports: [CommonModule, InvoiceCard],
  templateUrl: './invoice.html',
  styleUrls: ['./invoice.css'],
})
export class Invoice {
  // demo data — replace with API
  invoices = signal<InvoiceModel[]>([
    {
      id: 'INV-001',
      client: 'TechCorp Inc.',
      project: 'E-commerce Redesign',
      amountUSD: 8500,
      issuedISO: '2024-08-01',
      dueISO: '2024-08-31',
      paidISO: '2024-08-28',
      status: 'paid',
      currency: 'USD',
    },
    {
      id: 'INV-002',
      client: 'TechCorp Inc.',
      project: 'E-commerce Redesign',
      amountUSD: 8500,
      issuedISO: '2024-08-01',
      dueISO: '2024-08-31',
      status: 'pending',
      currency: 'USD',
    },
    {
      id: 'INV-003',
      client: 'TechCorp Inc.',
      project: 'E-commerce Redesign',
      amountUSD: 8500,
      issuedISO: '2024-08-01',
      dueISO: '2024-08-31',
      paidISO: '2024-08-28',
      status: 'paid',
      currency: 'USD',
    },
    {
      id: 'INV-004',
      client: 'TechCorp Inc.',
      project: 'E-commerce Redesign',
      amountUSD: 3400,
      issuedISO: '2024-08-01',
      dueISO: '2024-08-15',
      status: 'overdue',
      currency: 'USD',
    },
  ]);

  // search text
  q = signal('');
  onSearchInput(e: Event) {
    this.q.set((e.target as HTMLInputElement).value);
  }

  // tabs
  tab = signal<TabKey>('all');
  setTab(t: TabKey) {
    this.tab.set(t);
  }

  // kpis
  totalRevenue = computed(() =>
    this.invoices()
      .filter((i) => i.status === 'paid')
      .reduce((s, i) => s + i.amountUSD, 0)
  );
  pendingAmt = computed(() =>
    this.invoices()
      .filter((i) => i.status === 'pending')
      .reduce((s, i) => s + i.amountUSD, 0)
  );
  overdueAmt = computed(() =>
    this.invoices()
      .filter((i) => i.status === 'overdue')
      .reduce((s, i) => s + i.amountUSD, 0)
  );
  thisMonthAmt = computed(() => 14700); // mock for screenshot; compute as you prefer

  // tab counts
  allCount = computed(() => this.invoices().length);
  paidCount = computed(() => this.invoices().filter((i) => i.status === 'paid').length);
  pendingCount = computed(() => this.invoices().filter((i) => i.status === 'pending').length);
  overdueCount = computed(() => this.invoices().filter((i) => i.status === 'overdue').length);

  // list shown
  filtered = computed(() => {
    const term = this.q().toLowerCase().trim();
    let list = this.invoices();
    switch (this.tab()) {
      case 'paid':
        list = list.filter((i) => i.status === 'paid');
        break;
      case 'pending':
        list = list.filter((i) => i.status === 'pending');
        break;
      case 'overdue':
        list = list.filter((i) => i.status === 'overdue');
        break;
      default:
        break;
    }
    if (!term) return list;
    return list.filter((i) =>
      (i.id + ' ' + i.client + ' ' + i.project).toLowerCase().includes(term)
    );
  });

  fmtMoney(n: number) {
    return n.toLocaleString(undefined, { maximumFractionDigits: 0 });
  }
}
