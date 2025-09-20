import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { API_BASE } from './api.config';
import { Observable } from 'rxjs';
import { DataCacheService } from './data-cache.service';
import {
  CreateTimeEntryDto,
  KpiSummaryResponse,
  PaginatedTimeEntries,
  ProjectAggregateResponse,
  TimeEntry,
  TimeEntryQuery,
  UpdateTimeEntryDto,
} from '../models/time-tracking';

@Injectable({
  providedIn: 'root',
})
export class TimeTrackingService {
  private apiUrl = API_BASE;

  constructor(private http: HttpClient, private cacheService: DataCacheService) {}

  // Temporary: cache-backed initial load (could be replaced by listTimeEntries with params)
  getTimeEntries(): Observable<TimeEntry[]> {
    return this.cacheService.getTimeEntries();
  }

  listTimeEntries(query: TimeEntryQuery): Observable<PaginatedTimeEntries> {
    let params = new HttpParams();
    for (const [k, v] of Object.entries(query)) {
      if (v === undefined || v === null || v === '') continue;
      params = params.set(k, String(v));
    }
    return this.http.get<PaginatedTimeEntries>(`${this.apiUrl}/time-entries`, { params });
  }

  getKpis(from: string, to: string): Observable<KpiSummaryResponse> {
    const params = new HttpParams().set('dateFrom', from).set('dateTo', to);
    return this.http.get<KpiSummaryResponse>(`${this.apiUrl}/time-entries/kpis`, { params });
  }

  getProjectSummary(query: {
    dateFrom?: string;
    dateTo?: string;
  }): Observable<ProjectAggregateResponse> {
    let params = new HttpParams().set('groupBy', 'project');
    if (query.dateFrom) params = params.set('dateFrom', query.dateFrom);
    if (query.dateTo) params = params.set('dateTo', query.dateTo);
    return this.http.get<ProjectAggregateResponse>(`${this.apiUrl}/time-entries/summary`, {
      params,
    });
  }

  // CRUD stubs - adjust endpoints when backend is finalized
  createTimeEntry(payload: CreateTimeEntryDto): Observable<{ data: TimeEntry }> {
    return this.http.post<{ data: TimeEntry }>(`${this.apiUrl}/time-entries`, payload);
  }

  updateTimeEntry(id: string, payload: UpdateTimeEntryDto): Observable<{ data: TimeEntry }> {
    return this.http.put<{ data: TimeEntry }>(`${this.apiUrl}/time-entries/${id}`, payload);
  }

  deleteTimeEntry(id: string): Observable<{ deleted: boolean }> {
    return this.http.delete<{ deleted: boolean }>(`${this.apiUrl}/time-entries/${id}`);
  }
}
