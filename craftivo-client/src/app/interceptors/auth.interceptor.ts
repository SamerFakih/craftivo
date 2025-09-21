import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpInterceptor, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private authService: AuthService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<any> {
    // Attach JSON header and include credentials (cookies)
    let headers: Record<string, string> = { 'Content-Type': 'application/json' };
    // Attach Bearer token if stored
    const token = this.authService.getToken?.() as string | undefined;
    if (token) headers = { ...headers, Authorization: `Bearer ${token}` };

    const authReq = req.clone({ setHeaders: headers, withCredentials: true });

    return next.handle(authReq).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          // Trigger logout flow so app state resets
          try {
            this.authService.logout();
          } catch {
            // swallow to avoid secondary errors in interceptor
          }
        }
        return throwError(() => error);
      })
    );
  }
}
