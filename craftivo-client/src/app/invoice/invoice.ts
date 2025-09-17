import {
  Component,
  computed,
  signal,
  OnInit,
  OnDestroy,
  inject,
  ChangeDetectionStrategy,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { InvoiceModel, InvoiceStatus } from '../models/invoice';
import { InvoiceCard } from '../components/invoice-card/invoice-card';
import { InvoiceService } from '../services/invoice.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ModalBusService } from '../services/modal-bus.service';
import { ReactiveFormsModule, FormBuilder, Validators, FormArray } from '@angular/forms';

type TabKey = 'all' | 'paid' | 'pending' | 'overdue';

@Component({
  selector: 'app-invoices-page',
  standalone: true,
  imports: [CommonModule, InvoiceCard, ReactiveFormsModule],
  templateUrl: './invoice.html',
  styleUrls: ['./invoice.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Invoice implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private fb = inject(FormBuilder);

  constructor(private invoiceService: InvoiceService) {}
  private modalBus = inject(ModalBusService);

  // fetch invoices from API
  invoices = signal<InvoiceModel[]>([]);

  ngOnInit() {
    this.invoiceService
      .getInvoices()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.invoices.set(data);
        },
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

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

  trackByInvoiceId(index: number, invoice: InvoiceModel): string {
    return invoice.id;
  }

  // Modal state + form
  showInvoiceModal = signal(false);
  invoiceMode = signal<'create' | 'edit' | 'view'>('create');
  currentInvoice = signal<InvoiceModel | null>(null);

  // Effect: respond to modal bus events
  private _busEffect = effect(() => {
    const evt = this.modalBus.event();
    if (!evt) return;
    if (evt.type === 'open-invoice-create') this.openCreate();
  });

  form = this.fb.nonNullable.group({
    client: ['', Validators.required],
    project: ['', Validators.required],
    issueDate: [''],
    dueDate: [''],
    taxPct: [0, [Validators.min(0)]],
    discountPct: [0, [Validators.min(0)]],
    notes: [''],
    items: this.fb.array([this.itemGroup()]),
  });

  itemGroup(desc = '', qty = 1, rate = 0) {
    return this.fb.nonNullable.group({
      description: [desc],
      qty: [qty, [Validators.min(0)]],
      rate: [rate, [Validators.min(0)]],
    });
  }
  get items(): FormArray {
    return this.form.controls.items as FormArray;
  }
  addItem() {
    this.items.push(this.itemGroup());
  }
  removeItem(i: number) {
    if (this.items.length > 1) this.items.removeAt(i);
  }

  // Totals
  get subtotal(): number {
    const v = this.form.getRawValue();
    return (v.items || []).reduce(
      (s: number, it: any) => s + Number(it.qty || 0) * Number(it.rate || 0),
      0
    );
  }
  get taxAmount(): number {
    const v = this.form.getRawValue();
    return this.subtotal * (Number(v.taxPct || 0) / 100);
  }
  get discountAmount(): number {
    const v = this.form.getRawValue();
    return this.subtotal * (Number(v.discountPct || 0) / 100);
  }
  get total(): number {
    return this.subtotal + this.taxAmount - this.discountAmount;
  }

  openCreate() {
    this.invoiceMode.set('create');
    this.currentInvoice.set(null);
    this.form.reset({
      client: '',
      project: '',
      issueDate: '',
      dueDate: '',
      taxPct: 0,
      discountPct: 0,
      notes: '',
    });
    this.form.setControl('items', this.fb.array([this.itemGroup()]));
    this.showInvoiceModal.set(true);
  }
  openEdit(inv: InvoiceModel) {
    this.invoiceMode.set('edit');
    this.currentInvoice.set(inv);
    this.form.reset({
      client: inv.client,
      project: inv.project,
      issueDate: inv.issuedISO?.slice(0, 10) || '',
      dueDate: inv.dueISO?.slice(0, 10) || '',
      taxPct: 0,
      discountPct: 0,
      notes: '',
    });
    // Seed items with a single line equal to amount
    this.form.setControl('items', this.fb.array([this.itemGroup('Service', 1, inv.amountUSD)]));
    this.showInvoiceModal.set(true);
  }
  openView(inv: InvoiceModel) {
    this.invoiceMode.set('view');
    this.currentInvoice.set(inv);
    this.showInvoiceModal.set(true);
  }
  closeInvoiceModal() {
    this.showInvoiceModal.set(false);
  }

  // Submit create/edit
  submitInvoice() {
    if (this.form.invalid) return;
    const v = this.form.getRawValue();
    const total = this.total;
    if (this.invoiceMode() === 'edit' && this.currentInvoice()) {
      const orig = this.currentInvoice()!;
      const updated: InvoiceModel = {
        ...orig,
        client: v.client,
        project: v.project,
        issuedISO: v.issueDate || orig.issuedISO,
        dueISO: v.dueDate || orig.dueISO,
        amountUSD: total,
      };
      this.invoices.update((list) => list.map((i) => (i.id === orig.id ? updated : i)));
      this.closeInvoiceModal();
      return;
    }

    const newId = `INV-${(this.invoices().length + 1).toString().padStart(3, '0')}`;
    const newInvoice: InvoiceModel = {
      id: newId,
      client: v.client,
      project: v.project,
      amountUSD: total,
      issuedISO: v.issueDate || new Date().toISOString().slice(0, 10),
      dueISO: v.dueDate || new Date().toISOString().slice(0, 10),
      status: 'pending',
      currency: 'USD',
    };
    this.invoices.update((list) => [newInvoice, ...list]);
    this.closeInvoiceModal();
  }

  // Option lists from existing invoices
  clientOptions = computed(() => Array.from(new Set(this.invoices().map((i) => i.client))).sort());
  projectOptions = computed(() =>
    Array.from(new Set(this.invoices().map((i) => i.project))).sort()
  );
}
