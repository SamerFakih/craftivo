import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { DataCacheService } from './data-cache.service';

@Injectable({
  providedIn: 'root',
})
export class TaskService {
  constructor(private dataCacheService: DataCacheService) {}

  getTasks(): Observable<any> {
    // Use cached data instead of direct HTTP calls
    return this.dataCacheService.getTasks();
  }

  // Add method to invalidate cache when tasks are updated
  invalidateCache(): void {
    this.dataCacheService.invalidateTasks();
  }
}
