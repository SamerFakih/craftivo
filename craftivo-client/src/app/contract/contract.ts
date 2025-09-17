import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { startWith } from 'rxjs';
import { ContractService, CreateContractPayload } from '../services/contract.service';

@Component({
  selector: 'app-contract',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './contract.html',
  styleUrls: ['./contract.css'],
})
export class Contract {
  private readonly fb = inject(FormBuilder);
  private readonly contractService = inject(ContractService);

  // Tabs
  readonly tabs = ['Templates', 'Contract Generator', 'My Contracts'] as const;
  activeTab = signal<(typeof this.tabs)[number]>('Templates');
  setTab(tab: (typeof this.tabs)[number]) {
    this.activeTab.set(tab);
  }

  // Header stats (derived later from myContracts)
  totalContracts = signal(0);
  signedCount = signal(0);
  pendingCount = signal(0);
  totalValue = signal(0);

  // Templates (static for now; service has no templates endpoint)
  templates = signal<any[]>([
    {
      id: 'web-dev',
      title: 'Web Development Contract',
      subtitle: 'Perfect for website and web application projects',
      tag: 'Popular',
      category: 'Development',
      priceLabel: 'Free',
      includes: ['Scope definition', 'Payment terms', 'Timeline', 'Revision limits'],
      icon: 'pi pi-file',
    },
    {
      id: 'graphic-design',
      title: 'Graphic Design Agreement',
      subtitle: 'Ideal for branding, logos, and design projects',
      tag: '',
      category: 'Design',
      priceLabel: 'Free',
      includes: ['Design rounds', 'File formats', 'Usage rights', 'Brand guidelines'],
      icon: 'pi pi-file',
    },
    {
      id: 'content-writing',
      title: 'Content Writing Contract',
      subtitle: 'For copywriting, blogging, and content creation',
      tag: '',
      category: 'Writing',
      priceLabel: 'Free',
      includes: ['Word count', 'Research included', 'SEO optimization', 'Publishing rights'],
      icon: 'pi pi-file',
    },
  ]);

  // Derived helper
  currency = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  });
  totalValueLabel = computed(() => this.currency.format(this.totalValue()));

  // Header KPI summaries to reuse shared component
  summarys = computed(() => [
    { key: 'Total Contracts', value: this.totalContracts(), icon: 'pi pi-file' },
    { key: 'Signed', value: this.signedCount(), icon: 'pi pi-check-circle' },
    { key: 'Pending', value: this.pendingCount(), icon: 'pi pi-clock' },
    { key: 'Total Value', value: this.totalValue(), icon: 'pi pi-dollar' },
  ]);

  // Contract Generator form
  paymentOptions = [
    '50% upfront, 50% on completion',
    'Milestone-based payments',
    'Hourly (weekly billing)',
    'Monthly retainer',
  ] as const;

  form = this.fb.nonNullable.group({
    clientName: ['', [Validators.required, Validators.minLength(2)]],
    clientEmail: ['', [Validators.email]],
    projectTitle: ['', [Validators.required, Validators.minLength(2)]],
    description: [''],
    startDate: [''],
    endDate: [''],
    totalAmount: [0, [Validators.min(0)]],
    paymentSchedule: [this.paymentOptions[0]],

    // Additional terms
    includeKillFee: [false],
    includeRushFee: [false],
    ipOwnership: [false],
    includeNda: [false],
    customTerms: [''],
  });

  // Form value as a signal for live preview
  readonly formValue = toSignal(this.form.valueChanges.pipe(startWith(this.form.getRawValue())), {
    initialValue: this.form.getRawValue(),
  });

  // Live preview derived state
  readonly preview = computed(() => {
    const v = this.formValue();
    const title = (v.projectTitle || 'Project Title').toString().toUpperCase();
    const client = (v.clientName || 'Client Name').toString().toUpperCase();
    const amount = this.currency.format(Number(v.totalAmount) || 0);
    const timeline =
      [v.startDate, v.endDate].filter(Boolean).join(' - ') || 'Start Date - End Date';

    const terms: string[] = [];
    if (v.includeKillFee) terms.push('Kill Fee');
    if (v.includeRushFee) terms.push('Rush Fee Terms');
    if (v.ipOwnership) terms.push('IP Ownership Transfer');
    if (v.includeNda) terms.push('NDA');
    if (v.customTerms?.trim()) terms.push('Custom Terms');

    return {
      title,
      client,
      amount,
      timeline,
      payment: v.paymentSchedule,
      terms,
    };
  });

  onUseTemplate(tpl: any) {
    // Prefill some sensible defaults based on template
    this.setTab('Contract Generator');
    const current = this.form.getRawValue();
    this.form.patchValue({
      projectTitle: current.projectTitle || tpl?.title || 'Project',
      description: current.description || tpl?.subtitle || '',
    });
  }

  onGenerate() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const payload: CreateContractPayload = {
      clientName: v.clientName!,
      clientEmail: v.clientEmail || undefined,
      projectTitle: v.projectTitle!,
      description: v.description || undefined,
      startDate: v.startDate || undefined,
      endDate: v.endDate || undefined,
      totalAmount: Number(v.totalAmount) || 0,
      paymentSchedule: v.paymentSchedule || undefined,
      terms: {
        includeKillFee: !!v.includeKillFee,
        includeRushFee: !!v.includeRushFee,
        ipOwnership: !!v.ipOwnership,
        includeNda: !!v.includeNda,
        customTerms: v.customTerms || undefined,
      },
    };

    this.isSubmitting.set(true);
    this.submitError.set(null);
    // Use AI-assisted backend to generate and save a draft
    this.contractService.generateFromForm(payload).subscribe({
      next: (res) => {
        const { contract } = res || {};
        const list = this.myContracts();
        const normalized = this.normalizeContract(contract || res);
        this.myContracts.set([normalized, ...list]);
        this.recomputeKPIs();
        this.isSubmitting.set(false);
        this.setTab('My Contracts');
      },
      error: (err) => {
        const msg = this.parseHttpError(err);
        this.submitError.set(msg || 'Failed to generate contract.');
        this.isSubmitting.set(false);
      },
    });
  }

  // My Contracts list (mock data)
  readonly myContracts = signal<
    Array<{
      id: string;
      title: string;
      client: string;
      type: string;
      created: string; // ISO date
      status: 'signed' | 'pending' | 'draft';
      amount: number;
    }>
  >([]);

  // Loading/submission flags
  isLoading = signal(false);
  isSubmitting = signal(false);
  submitError = signal<string | null>(null);

  // Normalize API contract to UI shape
  private normalizeContract(c: any) {
    return {
      id: String(c?.id ?? c?._id ?? c?.contract_id ?? Math.random().toString(36).slice(2)),
      title: c?.title ?? c?.projectTitle ?? 'Untitled Contract',
      client: c?.client ?? c?.clientName ?? c?.client_name ?? 'Unknown Client',
      type: c?.type ?? c?.template ?? 'Custom',
      created: (c?.created_at || c?.created || new Date().toISOString()).slice(0, 10),
      status: (c?.status ?? 'draft') as 'signed' | 'pending' | 'draft',
      amount: Number(c?.contract_value ?? c?.amount ?? c?.totalAmount ?? 0),
    };
  }

  // Recompute KPIs from myContracts
  private recomputeKPIs() {
    const list = this.myContracts();
    this.totalContracts.set(list.length);
    this.signedCount.set(list.filter((c) => c.status === 'signed').length);
    this.pendingCount.set(list.filter((c) => c.status === 'pending').length);
    this.totalValue.set(list.reduce((s, c) => s + (Number(c.amount) || 0), 0));
  }

  // Init: fetch templates and contracts
  ngOnInit() {
    // Load existing contracts
    this.contractService.getContracts().subscribe({
      next: (list) => {
        const mapped = (Array.isArray(list) ? list : []).map((c) => this.normalizeContract(c));
        this.myContracts.set(mapped);
        this.recomputeKPIs();
      },
      error: () => {
        // keep empty list on error
      },
    });
  }

  // Icon mapping for status
  statusIcon(status: 'signed' | 'pending' | 'draft') {
    switch (status) {
      case 'signed':
        return 'pi pi-check-circle';
      case 'pending':
        return 'pi pi-clock';
      default:
        return 'pi pi-file';
    }
  }

  // Actions placeholders
  onView(contractId: string) {
    // Could navigate to contract viewer in the future
    console.log('View contract', contractId);
  }
  onEdit(contractId: string) {
    // Open edit flow (deferred)
    console.log('Edit contract', contractId);
  }
  onDownload(contractId: string) {
    // No download endpoint in current service; placeholder
    console.log('Download (TODO endpoint)', contractId);
  }
  onSend(contractId: string) {
    // No send endpoint in current service; placeholder
    console.log('Send (TODO endpoint)', contractId);
  }

  private parseHttpError(e: any): string {
    try {
      if (!e) return 'Unknown error';
      const status = e.status;
      const body = e.error ?? e.message ?? e;
      if (typeof body === 'string') return `${status || ''} ${body}`.trim();
      if (body && typeof body === 'object') {
        if (body.message) return `${status || ''} ${body.message}`.trim();
        if (body.error) return `${status || ''} ${body.error}`.trim();
        return `${status || ''} ${JSON.stringify(body)}`.trim();
      }
      return String(body ?? 'Unknown error');
    } catch {
      return 'Unknown error';
    }
  }
}
