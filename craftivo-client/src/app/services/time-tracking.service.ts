import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class TimeTrackingService {
  private apiUrl = 'http://localhost:3000/api/v1';

  constructor(private http: HttpClient) {}

  getTimeEntries(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/time-entries`, { withCredentials: true });
  }
}
