import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { DataCacheService } from './data-cache.service';

@Injectable({
  providedIn: 'root',
})
export class ProjectService {
  constructor(private dataCacheService: DataCacheService) {}

  getProjects(): Observable<any> {
    // Use cached data instead of direct HTTP calls
    return this.dataCacheService.getProjects();
  }

  // Add method to invalidate cache when projects are updated
  invalidateCache(): void {
    this.dataCacheService.invalidateProjects();
  }
}
