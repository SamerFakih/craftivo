import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, map, Observable, of, throwError } from 'rxjs';
import { API_BASE } from './api.config';

export interface CreateContractPayload {
  clientName: string;
  clientEmail?: string;
  projectTitle: string;
  description?: string;
  startDate?: string; // 'YYYY-MM-DD'
  endDate?: string; // 'YYYY-MM-DD'
  totalAmount?: number;
  paymentSchedule?: string; // UI label
  // Optional extended fields if available from other parts of the app
  projectType?: string;
  currency?: string; // default USD
  deliverables?: string[];
  clientId?: number;
  projectId?: number;
  clientIndustry?: string;
  freelancerName?: string;
  title?: string;
  // snake_case synonyms for compatibility if caller passes raw values
  client_id?: number;
  project_id?: number;
  contract_value?: number;
  start_date?: string;
  end_date?: string;
  terms?: {
    includeKillFee?: boolean;
    includeRushFee?: boolean;
    ipOwnership?: boolean;
    includeNda?: boolean;
    customTerms?: string;
  };
}

export interface ContractRecipient {
  role: 'client' | 'freelancer';
  email: string;
  sentAt?: string;
  openedAt?: string;
  signedAt?: string;
}

export interface ContractVersion {
  id: number;
  createdAt: string;
  source: 'ai' | 'manual' | 'regenerate';
  diffSummary?: string;
}

export interface ContractAuditEvent {
  id: number;
  at: string;
  type:
    | 'generated'
    | 'sent'
    | 'viewed_public'
    | 'viewed_internal'
    | 'signed_client'
    | 'signed_freelancer'
    | 'regenerated'
    | 'resent'
    | 'downloaded_pdf';
  actorRole?: 'client' | 'freelancer' | 'system';
  meta?: any;
}

export interface ContractEntity {
  id: number | string;
  uuid?: string;
  title: string;
  status: 'draft' | 'pending_signature' | 'partially_signed' | 'fully_signed' | 'archived';
  contractValue?: number;
  currency?: string;
  startDate?: string;
  endDate?: string;
  clientId?: number;
  projectId?: number;
  clientName?: string;
  freelancerName?: string;
  content: string; // markdown
  signedByClientAt?: string;
  signedByFreelancerAt?: string;
  createdAt?: string;
  updatedAt?: string;
  recipients?: ContractRecipient[];
}

export interface SendContractPayload {
  recipients: { role: 'client' | 'freelancer'; email: string }[];
  message?: string;
}

export interface SignContractPayload {
  role: 'client' | 'freelancer';
  name: string;
  signatureType: 'typed' | 'drawn';
  signatureData?: string; // base64 if drawn
}

export interface PublicContractEntity extends ContractEntity {
  publicToken?: string;
  // Possibly restrict fields if backend trims sensitive properties for public access
}

export interface PublicSignPayload {
  name: string;
  role?: 'client' | 'freelancer';
  signatureType?: 'typed' | 'drawn';
  signatureData?: string;
}

@Injectable({ providedIn: 'root' })
export class ContractService {
  // Backend has a global prefix in main.ts: app.setGlobalPrefix('api/v1')
  private apiUrl = API_BASE;
  private http = inject(HttpClient);

  // Lightweight client-side cache (can be replaced with DataCacheService later)
  contracts = signal<ContractEntity[] | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);

  // ————— AI: Generate and save a draft from your form —————
  generateFromForm(payload: CreateContractPayload): Observable<{ contract: any; aiMeta: any }> {
    const body = this.mapUiToBackend(payload);
    // Optional: enable debug logging by uncommenting below
    // console.debug('[Contract] generate-and-save payload', body);
    return (
      this.http
        // Updated endpoint per backend change: /contracts/agent/run
        .post<any>(`${this.apiUrl}/contracts/agent/run`, body, { withCredentials: true })
        .pipe(
          map((resp) => {
            // Backend swagger example may return flat contract fields + optional AI metadata
            // Try to detect aiMeta nested or meta field
            if (!resp) return { contract: {}, aiMeta: null } as any;
            const aiMeta = resp.aiMeta || resp.meta || resp.ai_meta || null;
            // If backend wraps contract inside resp.contract use it; else treat resp as contract
            const rawContract = resp.contract || resp;
            return { contract: rawContract, aiMeta };
          }),
          catchError((err) => {
            // Provide clearer diagnostics for common local dev issues
            if (err.status === 0) {
              // eslint-disable-next-line no-console
              console.error(
                '[ContractService] Network/Proxy error calling agent/run. Check that:',
                {
                  suggestion:
                    'Backend running on http://localhost:3000 and proxy.conf.json active (--proxy-config).',
                  attemptedUrl: `${this.apiUrl}/contracts/agent/run`,
                  original: err,
                }
              );
            }
            return this.handleError('Failed to generate contract', err);
          })
        )
    );
  }

  // ————— Contracts —————
  getContracts(): Observable<ContractEntity[]> {
    this.loading.set(true);
    this.error.set(null);
    return this.http
      .get<ContractEntity[]>(`${this.apiUrl}/contracts`, { withCredentials: true })
      .pipe(
        map((list) => {
          this.contracts.set(list);
          this.loading.set(false);
          return list;
        })
      );
  }

  getContract(id: string | number): Observable<ContractEntity> {
    return this.http
      .get<ContractEntity>(`${this.apiUrl}/contracts/${id}`, { withCredentials: true })
      .pipe(catchError((err) => this.handleError('Failed to load contract', err)));
  }

  // Persist a generated contract if agent/run only returns draft data
  saveContract(draft: any): Observable<ContractEntity> {
    const body: any = this.mapDraftToCreate(draft);
    return this.http
      .post<ContractEntity>(`${this.apiUrl}/contracts`, body, { withCredentials: true })
      .pipe(catchError((err) => this.handleError('Failed to save contract', err)));
  }

  // Send for signature (placeholder until backend live)
  sendForSignature(id: number | string, payload: SendContractPayload): Observable<any> {
    return this.http
      .post(`${this.apiUrl}/contracts/${id}/send`, payload, { withCredentials: true })
      .pipe(
        catchError((err) => {
          // eslint-disable-next-line no-console
          console.error('[ContractService] sendForSignature failed', {
            id,
            payload,
            status: err?.status,
            backendBody: err?.error,
          });
          // Try to build a richer validation message
          const body = err?.error;
          if (body) {
            let msg: string | undefined;
            if (typeof body === 'string') msg = body;
            else if (body.message) msg = body.message;
            else if (body.error) msg = body.error;
            else if (body.errors) {
              if (Array.isArray(body.errors)) msg = body.errors.join(', ');
              else if (typeof body.errors === 'object') {
                const flat = Object.values(body.errors)
                  .flat()
                  .map((v: any) => (typeof v === 'string' ? v : JSON.stringify(v)));
                msg = flat.join(', ');
              }
            }
            if (msg) {
              return throwError(() => new Error(msg));
            }
          }
          return this.handleError('Failed to send contract', err);
        })
      );
  }

  sign(id: number | string, payload: SignContractPayload): Observable<any> {
    return this.http
      .post(`${this.apiUrl}/contracts/${id}/sign`, payload, { withCredentials: true })
      .pipe(catchError((err) => this.handleError('Failed to sign contract', err)));
  }

  resend(id: number | string): Observable<any> {
    return this.http
      .post(`${this.apiUrl}/contracts/${id}/resend`, {}, { withCredentials: true })
      .pipe(catchError((err) => this.handleError('Failed to resend contract', err)));
  }

  regenerate(id: number | string): Observable<ContractEntity> {
    return this.http
      .post<ContractEntity>(
        `${this.apiUrl}/contracts/${id}/regenerate`,
        {},
        { withCredentials: true }
      )
      .pipe(catchError((err) => this.handleError('Failed to regenerate contract', err)));
  }

  getVersions(id: number | string): Observable<ContractVersion[]> {
    return this.http
      .get<ContractVersion[]>(`${this.apiUrl}/contracts/${id}/versions`, { withCredentials: true })
      .pipe(catchError((err) => this.handleError('Failed to load versions', err)));
  }

  getAudit(id: number | string): Observable<ContractAuditEvent[]> {
    return this.http
      .get<ContractAuditEvent[]>(`${this.apiUrl}/contracts/${id}/audit`, { withCredentials: true })
      .pipe(catchError((err) => this.handleError('Failed to load audit trail', err)));
  }

  downloadPdf(id: number | string): Observable<Blob> {
    return this.http
      .get(`${this.apiUrl}/contracts/${id}/download`, {
        withCredentials: true,
        responseType: 'blob',
      })
      .pipe(catchError((err) => this.handleBlobError('Failed to download PDF', err)));
  }

  getAgentLogs(id: string | number): Observable<any[]> {
    return this.http
      .get<any[]>(`${this.apiUrl}/contracts/${id}/agent-logs`, { withCredentials: true })
      .pipe(catchError((err) => this.handleError('Failed to load agent logs', err)));
  }

  // ————— Public endpoints —————
  getPublicContract(token: string): Observable<PublicContractEntity> {
    return this.http
      .get<PublicContractEntity>(`${this.apiUrl}/contracts/public/${token}`)
      .pipe(catchError((err) => this.handleError('Failed to load public contract', err)));
  }

  signPublicContract(token: string, payload: PublicSignPayload): Observable<any> {
    return this.http
      .post(`${this.apiUrl}/contracts/public/${token}/sign`, payload)
      .pipe(catchError((err) => this.handleError('Failed to sign public contract', err)));
  }

  // ————— helpers —————

  private mapUiToBackend(p: CreateContractPayload) {
    // Ensure 'YYYY-MM-DD' (backend converts to Date)
    const toIsoDate = (d?: string) => (d ? new Date(d).toISOString().slice(0, 10) : undefined);
    // Full ISO 8601 date-time string
    const toIsoDateTime = (d?: string) => (d ? new Date(d).toISOString() : undefined);
    const start = p.startDate ? new Date(p.startDate) : undefined;
    const end = p.endDate ? new Date(p.endDate) : undefined;
    const durationWeeks =
      start && end ? Math.max(1, Math.ceil((+end - +start) / (7 * 24 * 3600 * 1000))) : undefined;

    const paymentStructure = this.mapPaymentStructure(p.paymentSchedule);
    const budget =
      p.contract_value != null
        ? Number(p.contract_value)
        : p.totalAmount != null
        ? Number(p.totalAmount)
        : undefined;

    // Map UI to backend example schema; send both camelCase and snake_case where helpful
    const body: any = {
      projectTitle: p.projectTitle,
      projectDescription: p.description,
      budget,
      currency: p.currency || 'USD',
      paymentStructure,
      durationWeeks,
      // Provide startDate in camelCase as full ISO 8601 per backend validation
      startDate: toIsoDateTime(p.startDate || p.start_date),
      // Prefer snake_case for dates to satisfy other backend consumers
      clientName: p.clientName,
      title: p.title || `${p.projectTitle} Agreement`,
      // Project type must be one of the allowed enums
      projectType: p.projectType || 'web-development',
      deliverables: p.deliverables,
      clientIndustry: p.clientIndustry,
      freelancerName: p.freelancerName,
      // Duplicates for compatibility with backend accepting snake_case
      contract_value: budget,
      start_date: toIsoDate(p.start_date || p.startDate),
      end_date: toIsoDate(p.end_date || p.endDate),
      client_id: p.client_id ?? p.clientId,
      project_id: p.project_id ?? p.projectId,
    };

    // Remove undefined keys to keep payload clean
    Object.keys(body).forEach((k) => body[k] === undefined && delete body[k]);
    return body;
  }

  // Map agent draft response to create payload expected by POST /contracts
  private mapDraftToCreate(d: any) {
    if (!d) return {};
    const pick = (k: string) => (d[k] !== undefined ? d[k] : undefined);
    const body: any = {
      title: pick('title') || pick('projectTitle') || 'Untitled Contract',
      content: pick('content') || pick('markdown') || pick('text') || '',
      client_id: pick('client_id') ?? pick('clientId'),
      project_id: pick('project_id') ?? pick('projectId'),
      contract_value:
        pick('contract_value') ?? pick('budget') ?? pick('totalAmount') ?? pick('amount'),
      currency: pick('currency') || 'USD',
      start_date: pick('start_date') ?? pick('startDate'),
      end_date: pick('end_date') ?? pick('endDate'),
    };
    Object.keys(body).forEach((k) => body[k] === undefined && delete body[k]);
    return body;
  }

  private mapPaymentStructure(label?: string): string | undefined {
    if (!label) return undefined;
    const normalized = label.toLowerCase();
    if (normalized.includes('milestone')) return 'milestone';
    if (normalized.includes('hourly')) return 'hourly';
    if (normalized.includes('retainer')) return 'retainer';
    if (normalized.includes('50%')) return 'milestone';
    return label;
  }

  // ————— Error helpers —————
  private extractMessage(err: any, fallback: string) {
    if (!err) return fallback;
    const body = err.error;
    if (!body) return err.message || fallback;
    if (typeof body === 'string') return body;
    if (body && typeof body === 'object')
      return body.message || body.error || err.message || fallback;
    return fallback;
  }

  private handleError<T = never>(fallback: string, err: any): Observable<T> {
    const msg = this.extractMessage(err, fallback);
    // Optionally set a global error signal here
    return throwError(() => new Error(msg));
  }

  private handleBlobError(fallback: string, err: any): Observable<any> {
    const msg = this.extractMessage(err, fallback);
    return throwError(() => new Error(msg));
  }
}
