import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { ClientModel } from '../models/client';
import { API_BASE } from './api.config';

@Injectable({ providedIn: 'root' })
export class ClientService {
  private apiUrl = API_BASE;

  constructor(private http: HttpClient) {}

  getClients(): Observable<ClientModel[]> {
    return this.http.get<any>(`${this.apiUrl}/clients`).pipe(
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
    return this.http.get<any>(`${this.apiUrl}/clients/${id}`).pipe(map(this.normalizeClient));
  }

  // Optional create/update/delete for future wiring
  createClient(payload: Partial<ClientModel>): Observable<ClientModel> {
    return this.http.post<any>(`${this.apiUrl}/clients`, payload).pipe(map(this.normalizeClient));
  }

  updateClient(id: string | number, payload: Partial<ClientModel>): Observable<ClientModel> {
    return this.http
      .put<any>(`${this.apiUrl}/clients/${id}`, payload)
      .pipe(map(this.normalizeClient));
  }

  deleteClient(id: string | number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/clients/${id}`);
  }

  // ——— helpers ———
  private normalizeClient = (c: any): ClientModel => {
    const id = String(c?.id ?? c?._id ?? c?.client_id ?? Math.random().toString(36).slice(2));
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
}
