import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, map, Observable, throwError } from 'rxjs';
import { ClientModel } from '../models/client';
import { API_BASE } from './api.config';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class ClientService {
  private apiUrl = API_BASE;

  constructor(private http: HttpClient) {}
  private auth = inject(AuthService);

  getClients(): Observable<ClientModel[]> {
    return this.http.get<any>(`${this.apiUrl}/clients`, { withCredentials: true }).pipe(
      map((raw) => {
        // Accept a variety of response envelope shapes
        const root = raw?.data ?? raw;
        const arr: any[] = Array.isArray(root)
          ? root
          : root?.clients || root?.items || root?.results || root?.data || [];
        return (Array.isArray(arr) ? arr : []).map(this.normalizeClient);
      })
    );
  }

  getClient(id: string | number): Observable<ClientModel> {
    return this.http.get<any>(`${this.apiUrl}/clients/${id}`, { withCredentials: true }).pipe(
      map(this.normalizeClient),
      catchError((e) => this.wrapHttpError('get client', e))
    );
  }

  // Optional create/update/delete for future wiring
  createClient(payload: Partial<ClientModel>): Observable<ClientModel> {
    const body: any = this.mapToBackend(payload);
    return this.http.post<any>(`${this.apiUrl}/clients`, body, { withCredentials: true }).pipe(
      map(this.normalizeClient),
      catchError((e) => this.wrapHttpError('create client', e))
    );
  }

  updateClient(id: string | number, payload: Partial<ClientModel>): Observable<ClientModel> {
    const body: any = this.mapToBackend(payload);
    return this.http.put<any>(`${this.apiUrl}/clients/${id}`, body, { withCredentials: true }).pipe(
      map(this.normalizeClient),
      catchError((e) => this.wrapHttpError('update client', e))
    );
  }

  deleteClient(id: string | number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/clients/${id}`, { withCredentials: true });
  }

  private normalizeClient = (c: any): ClientModel => {
    const rawId = c?.id ?? c?._id ?? c?.client_id;
    const hasBackendId = rawId != null && rawId !== '';
    const id = String(hasBackendId ? rawId : Math.random().toString(36).slice(2));
    const name = c?.name ?? c?.company ?? 'Unnamed Client';
    const rawStatus = c?.status ?? (c?.active === false ? 'inactive' : 'active');
    const status: 'active' | 'inactive' | 'prospect' =
      rawStatus === 'inactive' || rawStatus === false
        ? 'inactive'
        : rawStatus === 'prospect'
        ? 'prospect'
        : 'active';
    const email = c?.email ?? c?.contact_email ?? '';
    const location =
      c?.location ?? c?.address ?? [c?.city, c?.country].filter(Boolean).join(', ') ?? '—';
    const primaryContact =
      c?.primaryContact ?? c?.phone ?? c?.contact_name ?? c?.contact ?? c?.email ?? '—';
    const industry = c?.industry ?? c?.sector ?? c?.company ?? '—';
    const joinedISO =
      c?.joinedISO ?? c?.joined_at ?? c?.created_at ?? new Date().toISOString().slice(0, 10);
    const tags: string[] = Array.isArray(c?.tags)
      ? c.tags.filter((t: any) => !!t && typeof t === 'string')
      : typeof c?.tags === 'string'
      ? c.tags
          .split(',')
          .map((t: string) => t.trim())
          .filter(Boolean)
      : [];

    const totalProjects = Number(c?.stats?.totalProjects ?? c?.projects_count ?? 0) || 0;
    const activeProjects = Number(c?.stats?.activeProjects ?? c?.active_projects ?? 0) || 0;
    const totalRevenueUSD =
      Number(c?.stats?.totalRevenueUSD ?? c?.revenueUSD ?? c?.revenue_usd ?? c?.revenue ?? 0) || 0;
    const lastContactISO = c?.stats?.lastContactISO ?? c?.last_contact ?? c?.last_contact_at ?? '';

    const avatarUrl = c?.avatarUrl ?? c?.avatar ?? c?.logo_url;
    const rating = c?.rating != null ? Number(c.rating) : undefined;

    return {
      id,
      serverId: hasBackendId ? Number(rawId) : undefined,
      temp: !hasBackendId,
      name,
      status,
      email,
      location,
      primaryContact,
      industry,
      joinedISO,
      tags,
      stats: { totalProjects, activeProjects, totalRevenueUSD, lastContactISO },
      avatarUrl,
      rating,
    };
  };

  private mapToBackend(p: Partial<ClientModel>) {
    const userId = Number(this.auth.currentUser()?.id); // may be NaN if not logged
    const body: any = {
      name: p.name,
      email: p.email || undefined,
      created_by: Number.isFinite(userId) ? userId : undefined,
    };
    Object.keys(body).forEach((k) => (body[k] === undefined || body[k] === '') && delete body[k]);
    return body;
  }

  private wrapHttpError(action: string, e: any) {
    let msg = `Failed to ${action}`;
    const err = e?.error ?? e;
    if (err) {
      if (typeof err === 'string') msg = err;
      else if (err.message) msg = err.message;
      else if (err.error) msg = err.error;
      else if (err.errors) {
        if (Array.isArray(err.errors)) msg = err.errors.join(', ');
        else if (typeof err.errors === 'object') {
          msg = Object.values(err.errors)
            .flat()
            .map((v: any) => (typeof v === 'string' ? v : JSON.stringify(v)))
            .join(', ');
        }
      }
      if (e.status) msg = `${e.status} ${msg}`;
    }
    return throwError(() => new Error(msg));
  }
}
