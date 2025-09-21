import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { MessageService } from 'primeng/api';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import {
  ContractService,
  ContractEntity,
  SendContractPayload,
  SignContractPayload,
  ContractVersion,
  ContractAuditEvent,
} from '../services/contract.service';

// Minimal markdown to HTML (placeholder; replace with a proper library if added to deps)
function simpleMarkdown(md: string): string {
  return md
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
    .replace(/\*(.*)\*/gim, '<em>$1</em>')
    .replace(/`([^`]+)`/gim, '<code>$1</code>')
    .replace(/\n$/gim, '<br />');
}

@Component({
  selector: 'app-contract-viewer',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './contract-viewer.html',
  styleUrls: ['./contract-viewer.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContractViewerComponent {
  private route = inject(ActivatedRoute);
  private service = inject(ContractService);
  private sanitizer = inject(DomSanitizer);
  private messages = inject(MessageService, { optional: true });

  loading = signal(true);
  error = signal<string | null>(null);
  contract = signal<ContractEntity | null>(null);
  // Modal / action states
  sending = signal(false);
  signing = signal(false);
  regenerating = signal(false);
  downloading = signal(false);
  resending = signal(false);
  showSend = signal(false);
  showSign = signal(false);
  // Lazy loaded panels
  versionsLoading = signal(false);
  auditLoading = signal(false);
  versions = signal<ContractVersion[] | null>(null);
  audit = signal<ContractAuditEvent[] | null>(null);
  showVersions = signal(false);
  showAudit = signal(false);
  actionError = signal<string | null>(null);

  html = computed<SafeHtml | null>(() => {
    const c = this.contract();
    if (!c?.content) return null;
    const raw = simpleMarkdown(c.content);
    return this.sanitizer.bypassSecurityTrustHtml(raw);
  });

  constructor() {
    effect(() => {
      const raw = this.route.snapshot.paramMap.get('id');
      if (!raw) {
        // eslint-disable-next-line no-console
        console.warn('[ContractViewer] No route id param');
        return;
      }
      // Accept numeric or string IDs (backend may use UUIDs)
      const id: string | number = isNaN(Number(raw)) ? raw : Number(raw);
      this.fetch(id);
    });
  }

  fetch(id: number | string) {
    this.loading.set(true);
    this.error.set(null);
    this.service.getContract(id).subscribe({
      next: (c) => {
        if (!c || (c as any).id == null) {
          // eslint-disable-next-line no-console
          console.warn('[ContractViewer] Loaded contract missing id field, raw:', c);
        }
        this.contract.set(c as any);
        this.loading.set(false);
      },
      error: (e) => {
        this.error.set('Failed to load contract');
        this.loading.set(false);
      },
    });
  }

  openSend() {
    this.showSend.set(true);
  }
  openSign() {
    this.showSign.set(true);
  }

  /**
   * Collect values from the send modal inputs, validate, then delegate to doSend.
   * Moved out of the template to avoid complex inline array/filter expressions that
   * broke the template parser and to give us a single place to enhance validation
   * or instrumentation (e.g. logging a 400 payload) while debugging backend schema.
   */
  onSendClick(clientEmail?: string, freelancerEmail?: string, message?: string) {
    const recipients: { role: 'client' | 'freelancer'; email: string }[] = [];
    const push = (role: 'client' | 'freelancer', email?: string) => {
      if (!email) return;
      const trimmed = email.trim();
      if (trimmed) recipients.push({ role, email: trimmed });
    };
    push('client', clientEmail);
    push('freelancer', freelancerEmail);

    if (!recipients.length) {
      this.actionError.set('Enter at least one recipient email');
      return;
    }

    // Basic email shape validation (keep lightweight; backend will still validate)
    const invalid = recipients.find((r) => !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(r.email));
    if (invalid) {
      this.actionError.set(`Invalid email: ${invalid.email}`);
      return;
    }

    this.actionError.set(null);

    // Trim and omit empty message
    const payloadMessage = (message || '').trim() || undefined;

    // Optional debug hook (uncomment while diagnosing 400s)
    // console.debug('[ContractViewer] Sending contract payload', { recipients, message: payloadMessage });

    this.doSend({ recipients, message: payloadMessage });
  }

  doSend(payload: SendContractPayload) {
    const c = this.contract();
    if (!c) return;
    // Merge logic: start from existing recipients (if any) and replace roles supplied in the new payload
    const existing = Array.isArray(c.recipients) ? c.recipients : [];
    const incomingByRole = new Map(payload.recipients.map((r) => [r.role, r.email] as const));
    const merged: { role: 'client' | 'freelancer'; email: string }[] = [];
    // Keep existing recipients whose role not overridden
    for (const r of existing) {
      if (!incomingByRole.has(r.role)) {
        if (r.email) merged.push({ role: r.role, email: r.email });
      }
    }
    // Add/override with incoming
    for (const r of payload.recipients) {
      merged.push({ role: r.role, email: r.email });
    }
    const finalPayload: SendContractPayload = { recipients: merged, message: payload.message };
    // Debug log to help diagnose backend 400s (safe to keep; remove if noisy)
    // eslint-disable-next-line no-console
    console.debug('[ContractViewer] doSend final payload', finalPayload);
    this.sending.set(true);
    this.service.sendForSignature(c.id, finalPayload).subscribe({
      next: () => {
        this.sending.set(false);
        this.showSend.set(false);
        this.fetch(c.id);
        this.messages?.add({
          severity: 'success',
          summary: 'Contract',
          detail: 'Sent for signature',
        });
      },
      error: (err) => {
        this.sending.set(false);
        this.actionError.set(err.message || 'Failed to send');
        this.messages?.add({
          severity: 'error',
          summary: 'Contract',
          detail: err.message || 'Send failed',
        });
      },
    });
  }

  doSign(payload: Omit<SignContractPayload, 'signatureType'>) {
    const c = this.contract();
    if (!c) return;
    this.signing.set(true);
    this.service.sign(c.id, { ...payload, signatureType: 'typed' }).subscribe({
      next: () => {
        this.signing.set(false);
        this.showSign.set(false);
        this.fetch(c.id);
        this.messages?.add({ severity: 'success', summary: 'Contract', detail: 'Signed' });
      },
      error: (err) => {
        this.signing.set(false);
        this.actionError.set(err.message || 'Failed to sign');
        this.messages?.add({
          severity: 'error',
          summary: 'Contract',
          detail: err.message || 'Sign failed',
        });
      },
    });
  }

  doResend() {
    const c = this.contract();
    if (!c) return;
    this.resending.set(true);
    this.service.resend(c.id).subscribe({
      next: () => {
        this.resending.set(false);
        this.fetch(c.id);
        this.messages?.add({ severity: 'success', summary: 'Contract', detail: 'Resent' });
      },
      error: (err) => {
        this.resending.set(false);
        this.actionError.set(err.message || 'Failed to resend');
        this.messages?.add({
          severity: 'error',
          summary: 'Contract',
          detail: err.message || 'Resend failed',
        });
      },
    });
  }

  doRegenerate() {
    const c = this.contract();
    if (!c) return;
    this.regenerating.set(true);
    this.service.regenerate(c.id).subscribe({
      next: (nc) => {
        this.regenerating.set(false);
        this.contract.set(nc);
        this.messages?.add({ severity: 'success', summary: 'Contract', detail: 'Regenerated' });
      },
      error: (err) => {
        this.regenerating.set(false);
        this.actionError.set(err.message || 'Failed to regenerate');
        this.messages?.add({
          severity: 'error',
          summary: 'Contract',
          detail: err.message || 'Regenerate failed',
        });
      },
    });
  }

  doDownload() {
    const c = this.contract();
    if (!c) return;
    this.downloading.set(true);
    this.service.downloadPdf(c.id).subscribe({
      next: (blob) => {
        this.downloading.set(false);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${c.title || 'contract'}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        this.messages?.add({ severity: 'success', summary: 'Contract', detail: 'PDF downloaded' });
      },
      error: (err) => {
        this.downloading.set(false);
        this.actionError.set(err.message || 'Download failed');
        this.messages?.add({
          severity: 'error',
          summary: 'Contract',
          detail: err.message || 'Download failed',
        });
      },
    });
  }

  toggleVersions() {
    this.showVersions.update((v) => !v);
    if (this.showVersions() && !this.versions()) this.loadVersions();
  }
  toggleAudit() {
    this.showAudit.update((v) => !v);
    if (this.showAudit() && !this.audit()) this.loadAudit();
  }

  private loadVersions() {
    const c = this.contract();
    if (!c) return;
    this.versionsLoading.set(true);
    this.service.getVersions(c.id).subscribe({
      next: (v) => {
        this.versions.set(v);
        this.versionsLoading.set(false);
      },
      error: (err) => {
        this.versionsLoading.set(false);
        this.actionError.set(err.message || 'Failed to load versions');
      },
    });
  }

  private loadAudit() {
    const c = this.contract();
    if (!c) return;
    this.auditLoading.set(true);
    this.service.getAudit(c.id).subscribe({
      next: (a) => {
        this.audit.set(a);
        this.auditLoading.set(false);
      },
      error: (err) => {
        this.auditLoading.set(false);
        this.actionError.set(err.message || 'Failed to load audit');
      },
    });
  }
}
