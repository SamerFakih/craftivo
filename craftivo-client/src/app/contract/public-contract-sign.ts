import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ContractService, PublicContractEntity } from '../services/contract.service';

@Component({
  selector: 'app-public-contract-sign',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './public-contract-sign.html',
  styleUrls: ['./public-contract-sign.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PublicContractSignComponent {
  private route = inject(ActivatedRoute);
  private service = inject(ContractService);
  private sanitizer = inject(DomSanitizer);

  loading = signal(true);
  error = signal<string | null>(null);
  token = signal<string | null>(null);
  name = signal('');
  signing = signal(false);
  contract = signal<PublicContractEntity | null>(null);
  signed = signal(false);
  actionError = signal<string | null>(null);

  html = computed<SafeHtml | null>(() => {
    const c = this.contract();
    if (!c) return null;
    const raw = c.content
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*)\*/gim, '<em>$1</em>');
    return this.sanitizer.bypassSecurityTrustHtml(raw);
  });

  constructor() {
    effect(() => {
      const t = this.route.snapshot.paramMap.get('token');
      if (t) {
        this.token.set(t);
        this.fetch(t);
      }
    });
  }

  fetch(token: string) {
    this.loading.set(true);
    this.error.set(null);
    this.service.getPublicContract(token).subscribe({
      next: (c) => {
        this.contract.set(c);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.message || 'Not found');
        this.loading.set(false);
      },
    });
  }

  sign() {
    if (!this.name().trim()) return;
    const token = this.token();
    if (!token) return;
    this.signing.set(true);
    this.actionError.set(null);
    this.service
      .signPublicContract(token, { name: this.name(), role: 'client', signatureType: 'typed' })
      .subscribe({
        next: () => {
          this.signing.set(false);
          this.signed.set(true);
        },
        error: (err) => {
          this.signing.set(false);
          this.actionError.set(err.message || 'Failed to sign');
        },
      });
  }
}
