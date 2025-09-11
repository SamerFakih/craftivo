import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class TaskService {
  private apiUrl = 'http://localhost:3000/api/v1';

  constructor(private http: HttpClient) {}

  getTasks(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/tasks`, { withCredentials: true });
  }
}
