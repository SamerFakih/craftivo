import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_BASE } from './api.config';
import { Observable } from 'rxjs';
import { DataCacheService } from './data-cache.service';

@Injectable({
  providedIn: 'root',
})
export class TimeTrackingService {
  private apiUrl = API_BASE;

  constructor(private http: HttpClient, private cacheService: DataCacheService) {}

  getTimeEntries(): Observable<any> {
    return this.cacheService.getTimeEntries();
  }
}
