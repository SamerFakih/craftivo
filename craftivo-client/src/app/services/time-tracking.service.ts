import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DataCacheService } from './data-cache.service';

@Injectable({
  providedIn: 'root',
})
export class TimeTrackingService {
  private apiUrl = 'http://localhost:3000/api/v1';

  constructor(private http: HttpClient, private cacheService: DataCacheService) {}

  getTimeEntries(): Observable<any> {
    return this.cacheService.getTimeEntries();
  }
}
