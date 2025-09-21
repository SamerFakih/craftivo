import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { DataCacheService } from './data-cache.service';
import { HttpClient } from '@angular/common/http';
import { API_BASE } from './api.config';

@Injectable({
  providedIn: 'root',
})
export class TaskService {
  private readonly apiUrl = API_BASE;

  constructor(private dataCacheService: DataCacheService, private http: HttpClient) {}

  getTasks(): Observable<any> {
    // Use cached data instead of direct HTTP calls
    return this.dataCacheService.getTasks();
  }

  // Add method to invalidate cache when tasks are updated
  invalidateCache(): void {
    this.dataCacheService.invalidateTasks();
  }

  createTask(payload: Record<string, unknown>): Observable<any> {
    return this.http.post(`${this.apiUrl}/tasks`, payload, { withCredentials: true });
  }
}
