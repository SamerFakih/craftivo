import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { DataCacheService } from './data-cache.service';

@Injectable({
  providedIn: 'root',
})
export class OverviewService {
  constructor(private dataCacheService: DataCacheService) {}

  getOverviewData(): Observable<any> {
    // Use cached data instead of direct HTTP calls
    return this.dataCacheService.getOverview();
  }

  // Add method to invalidate cache when overview data needs refresh
  invalidateCache(): void {
    this.dataCacheService.clearAllCaches();
  }
}
