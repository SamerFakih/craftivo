import { Component, signal, computed, ChangeDetectionStrategy, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ClientModel } from '../models/client';
import { ClientCard } from '../components/client-card/client-card';
import { ClientService } from '../services/client.service';

@Component({
  selector: 'app-clients-page',
  standalone: true,
  imports: [CommonModule, ClientCard, ReactiveFormsModule],
  templateUrl: './client.html',
  styleUrls: ['./client.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Client {
  private readonly clientService = inject(ClientService);
  private readonly fb = inject(FormBuilder);

  clients = signal<ClientModel[]>([]);
  isLoading = signal(false);
  error = signal<string | null>(null);
  isSubmitting = signal(false);
  submitError = signal<string | null>(null);

  // Form / modal state
  showForm = signal(false);
  formMode = signal<'create' | 'edit'>('create');
  current = signal<ClientModel | null>(null);

  clientForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.email]],
    primaryContact: [''],
    industry: [''],
    location: [''],
    tags: [''], // comma separated input -> array
    status: ['active' as 'active' | 'inactive' | 'prospect'],
  });

  ngOnInit() {
    this.isLoading.set(true);
    this.clientService.getClients().subscribe({
      next: (items) => {
        this.clients.set(items);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.error.set(typeof err === 'string' ? err : 'Failed to load clients');
        this.isLoading.set(false);
      },
    });
  }

  // Open create modal
  openCreate() {
    this.formMode.set('create');
    this.current.set(null);
    this.clientForm.reset({
      name: '',
      email: '',
      primaryContact: '',
      industry: '',
      location: '',
      tags: '',
      status: 'active',
    });
    this.submitError.set(null);
    this.showForm.set(true);
  }

  // Open edit modal
  openEdit(c: ClientModel) {
    this.formMode.set('edit');
    this.current.set(c);
    this.clientForm.reset({
      name: c.name,
      email: c.email,
      primaryContact: c.primaryContact,
      industry: c.industry,
      location: c.location,
      tags: c.tags.join(', '),
      status: c.status,
    });
    this.submitError.set(null);
    this.showForm.set(true);
  }

  closeForm() {
    this.showForm.set(false);
  }

  private parseTags(raw: string): string[] {
    return raw
      .split(',')
      .map((t) => t.trim())
      .filter((t) => !!t);
  }

  submitForm() {
    if (this.clientForm.invalid) {
      this.clientForm.markAllAsTouched();
      return;
    }
    this.isSubmitting.set(true);
    this.submitError.set(null);
    const v = this.clientForm.getRawValue();
    const payload = {
      name: v.name.trim(),
      email: v.email?.trim() || undefined,
      primaryContact: v.primaryContact?.trim() || undefined,
      industry: v.industry?.trim() || undefined,
      location: v.location?.trim() || undefined,
      tags: this.parseTags(v.tags),
      status: v.status,
    } as any;

    if (this.formMode() === 'edit' && this.current()) {
      const id = this.current()!.id;
      this.clientService.updateClient(id, payload).subscribe({
        next: (updated) => {
          this.clients.update((list) => list.map((c) => (c.id === id ? updated : c)));
          this.isSubmitting.set(false);
          this.closeForm();
        },
        error: (err) => {
          this.submitError.set(typeof err === 'string' ? err : 'Failed to update client');
          this.isSubmitting.set(false);
        },
      });
      return;
    }

    this.clientService.createClient(payload).subscribe({
      next: (created) => {
        this.clients.update((list) => [created, ...list]);
        this.isSubmitting.set(false);
        this.closeForm();
      },
      error: (err) => {
        this.submitError.set(typeof err === 'string' ? err : 'Failed to create client');
        this.isSubmitting.set(false);
      },
    });
  }

  // Delete with confirm
  deleteClient(c: ClientModel) {
    if (!confirm(`Delete client "${c.name}"? This cannot be undone.`)) return;
    const prev = this.clients();
    this.clients.update((list) => list.filter((x) => x.id !== c.id));
    this.clientService.deleteClient(c.id).subscribe({
      next: () => {},
      error: () => {
        this.clients.set(prev);
        alert('Failed to delete client');
      },
    });
  }

  // search
  q = signal('');
  onSearchInput(e: Event) {
    this.q.set((e.target as HTMLInputElement).value);
  }

  // KPIs
  totalClients = computed(() => this.clients().length);
  activeClients = computed(() => this.clients().filter((c) => c.status === 'active').length);
  totalRevenue = computed(() => this.clients().reduce((s, c) => s + c.stats.totalRevenueUSD, 0));
  avgRating = computed(() => {
    const arr = this.clients().map((c) => c.rating ?? 0);
    return arr.length ? +(arr.reduce((s, x) => s + x, 0) / arr.length).toFixed(1) : 0;
  });

  filtered = computed(() => {
    const term = this.q().toLowerCase().trim();
    if (!term) return this.clients();
    return this.clients().filter((c) =>
      (c.name + ' ' + c.primaryContact + ' ' + c.industry + ' ' + c.tags.join(' '))
        .toLowerCase()
        .includes(term)
    );
  });

  money(n: number) {
    return n.toLocaleString(undefined, { maximumFractionDigits: 0 });
  }
}
