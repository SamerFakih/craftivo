import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
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

@Injectable({ providedIn: 'root' })
export class ContractService {
  // Backend has a global prefix in main.ts: app.setGlobalPrefix('api/v1')
  private apiUrl = API_BASE;

  constructor(private http: HttpClient) {}

  // ————— AI: Generate and save a draft from your form —————
  generateFromForm(payload: CreateContractPayload): Observable<{ contract: any; aiMeta: any }> {
    const body = this.mapUiToBackend(payload);
    // Optional: enable debug logging by uncommenting below
    // console.debug('[Contract] generate-and-save payload', body);
    return this.http
      .post<any>(`${this.apiUrl}/contracts/ai/generate-and-save`, body, { withCredentials: true })
      .pipe(
        map((resp) => {
          // Backend returns the contract object with resp.aiMeta attached.
          // Convert to { contract, aiMeta } for your UI.
          const { aiMeta, ...contract } = resp || {};
          return { contract, aiMeta };
        })
      );
  }

  // ————— Contracts —————
  getContracts(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/contracts`, { withCredentials: true });
  }

  getContract(id: string | number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/contracts/${id}`, { withCredentials: true });
  }

  getAgentLogs(id: string | number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/contracts/${id}/agent-logs`, {
      withCredentials: true,
    });
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

  private mapPaymentStructure(label?: string): string | undefined {
    if (!label) return undefined;
    const normalized = label.toLowerCase();
    if (normalized.includes('milestone')) return 'milestone';
    if (normalized.includes('hourly')) return 'hourly';
    if (normalized.includes('retainer')) return 'retainer';
    if (normalized.includes('50%')) return 'milestone';
    return label;
  }
}
