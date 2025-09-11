import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class OverviewService {
  private apiUrl = 'http://localhost:3000/api/v1/overview';

  constructor(private http: HttpClient) {}

  getOverviewData(): Observable<any> {
    return this.http.get<any>(this.apiUrl, { withCredentials: true });
  }
}
