import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_BASE } from './api.config';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class InvoiceService {
  private apiUrl = API_BASE;

  constructor(private http: HttpClient) {}

  getInvoices(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/invoices`, { withCredentials: true });
  }
}
