import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ProjectService {
  private apiUrl = 'http://localhost:3000/api/v1';

  constructor(private http: HttpClient) {}

  getProjects(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/projects`, { withCredentials: true });
  }
}
