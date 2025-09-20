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
    // If client has serverId verify it still exists before editing (prevents stale edit + 404 later)
    if (c.serverId && !c.temp) {
      this.clientService.getClient(c.serverId).subscribe({
        next: (fresh) => {
          this.launchEdit(fresh);
        },
        error: (err) => {
          const msg = typeof err === 'string' ? err : err?.message || '';
          if (/404/.test(msg) || /not found/i.test(msg)) {
            // Remove stale client
            this.clients.update((list) => list.filter((x) => x.serverId !== c.serverId));
            this.submitError.set(
              'This client no longer exists on the server. It was removed locally.'
            );
          } else {
            this.submitError.set(msg || 'Failed to open client for edit');
          }
        },
      });
    } else {
      // temp or missing server id: cannot edit persisted fields
      this.submitError.set(
        'This client has not been saved to the server yet and cannot be edited.'
      );
    }
  }

  private launchEdit(c: ClientModel) {
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
      // Other fields intentionally omitted: backend rejects them
    } as any;

    if (this.formMode() === 'edit' && this.current()) {
      const cur = this.current()!;
      if (cur.temp || cur.serverId == null) {
        this.submitError.set('Cannot update unsaved client. Please recreate.');
        this.isSubmitting.set(false);
        return;
      }
      const id = cur.serverId;
      this.clientService.updateClient(id, payload).subscribe({
        next: (updated) => {
          this.clients.update((list) => list.map((c) => (c.serverId === id ? updated : c)));
          this.isSubmitting.set(false);
          this.closeForm();
        },
        error: (err) => {
          const msg = typeof err === 'string' ? err : err?.message || 'Failed to update client';
          // If backend says 404, treat as stale client (was deleted or never persisted)
          if (/^404\b/.test(msg) || /not found/i.test(msg)) {
            // eslint-disable-next-line no-console
            console.warn('[Client Update] 404 - removing stale client from list', cur);
            const previousList = this.clients();
            this.clients.update((list) => list.filter((c) => c.serverId !== id));
            // Attempt a recreate (upsert) so user changes are not lost
            const recreate = {
              name: payload.name,
              email: payload.email,
            } as any;
            this.clientService.createClient(recreate).subscribe({
              next: (created) => {
                // Insert recreated client at top while preserving order of others
                this.clients.update((list) => [created, ...list]);
                this.submitError.set(
                  'Original client was missing (404). A new client has been created with your changes.'
                );
              },
              error: (createErr) => {
                // Rollback list if recreate fails
                this.clients.set(previousList.filter((c) => c.serverId !== id));
                this.submitError.set(
                  'Original client missing (404) and recreate failed: ' +
                    (createErr?.message || 'Unknown error')
                );
              },
            });
          } else {
            this.submitError.set(msg);
          }
          this.isSubmitting.set(false);
        },
      });
      return;
    }

    // eslint-disable-next-line no-console
    console.debug('[Client Create] payload', payload);
    this.clientService.createClient(payload).subscribe({
      next: (created) => {
        this.clients.update((list) => [created, ...list]);
        this.isSubmitting.set(false);
        this.closeForm();
      },
      error: (err) => {
        // eslint-disable-next-line no-console
        console.error('[Client Create] error', err);
        this.submitError.set(
          err?.message || (typeof err === 'string' ? err : 'Failed to create client')
        );
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
