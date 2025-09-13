import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { DataCacheService } from './data-cache.service';

@Injectable({
  providedIn: 'root',
})
export class TeamService {
  constructor(private dataCacheService: DataCacheService) {}

  getTeamMembers(): Observable<any> {
    // Use cached data instead of direct HTTP calls
    return this.dataCacheService.getTeamMembers();
  }

  // Add method to invalidate cache when team data is updated
  invalidateCache(): void {
    this.dataCacheService.invalidateTeam();
  }
}
