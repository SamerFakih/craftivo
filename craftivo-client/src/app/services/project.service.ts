import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { API_BASE } from './api.config';
import { DataCacheService } from './data-cache.service';

@Injectable({
  providedIn: 'root',
})
export class ProjectService {
  private readonly apiUrl = API_BASE;

  constructor(private dataCacheService: DataCacheService, private http: HttpClient) {}

  getProjects(): Observable<any> {
    // Use cached data instead of direct HTTP calls
    return this.dataCacheService.getProjects();
  }

  // Add method to invalidate cache when projects are updated
  invalidateCache(): void {
    this.dataCacheService.invalidateProjects();
  }

  // Create a new project
  createProject(payload: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/projects`, payload, { withCredentials: true });
  }

  // Update an existing project
  updateProject(id: number | string, payload: any): Observable<any> {
    return this.http.patch(`${this.apiUrl}/projects/${id}`, payload, { withCredentials: true });
  }
}
