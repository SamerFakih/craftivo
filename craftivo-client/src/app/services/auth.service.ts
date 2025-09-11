import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError, of } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { Router } from '@angular/router';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar?: string;
}

export interface AuthResponse {
  user: User;
  message?: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = 'http://localhost:3000/api/v1/auth';

  private isLoggedInSubject = new BehaviorSubject<boolean>(false);
  private currentUserSubject = new BehaviorSubject<User | null>(null);

  isLoggedIn$ = this.isLoggedInSubject.asObservable();
  currentUser$ = this.currentUserSubject.asObservable();

  // Signal-based approach
  isLoggedIn = signal(false);
  currentUser = signal<User | null>(null);

  constructor(private http: HttpClient, private router: Router) {}

  // Used by AuthGuard to check auth status and return Observable<boolean>
  public checkAuthStatusGuard(): Observable<boolean> {
    return this.http.get<any>(`${this.apiUrl}/profile`, { withCredentials: true }).pipe(
      map((response: any) => {
        const user = response.user ? response.user : response;
        this.isLoggedIn.set(true);
        this.currentUser.set(user);
        return true;
      }),
      catchError(() => {
        this.isLoggedIn.set(false);
        this.currentUser.set(null);
        return of(false);
      })
    );
  }

  // Login with HTTP-only cookies
  login(email: string, password: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(
        `${this.apiUrl}/login`,
        { email, password },
        {
          withCredentials: true, // Important: sends cookies with request
        }
      )
      .pipe(
        tap((response) => this.handleAuthSuccess(response.user)),
        catchError(this.handleError)
      );
  }

  // Register with HTTP-only cookies
  register(userData: any): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/register`, userData, {
        withCredentials: true,
      })
      .pipe(
        tap((response) => this.handleAuthSuccess(response.user)),
        catchError(this.handleError)
      );
  }

  // Handle successful authentication
  private handleAuthSuccess(user: User): void {
    this.isLoggedIn.set(true);
    this.currentUser.set(user);
  }

  // Check authentication status from backend (restore state)
  checkAuthStatus(): void {
    this.http.get<any>(`${this.apiUrl}/profile`, { withCredentials: true }).subscribe({
      next: (response) => {
        // Support both { user: ... } and plain user object
        const user = response.user ? response.user : response;
        this.isLoggedIn.set(true);
        this.currentUser.set(user);
      },
      error: () => {
        this.isLoggedIn.set(false);
        this.currentUser.set(null);
      },
    });
  }

  // Logout and clear state
  logout(): void {
    this.http.post(`${this.apiUrl}/logout`, {}, { withCredentials: true }).subscribe({
      next: () => this.handleLogout(),
      error: () => this.handleLogout(),
    });
  }

  private handleLogout(): void {
    this.isLoggedIn.set(false);
    this.currentUser.set(null);
    this.router.navigate(['/signin']);
  }

  // Handle errors
  private handleError(error: any): Observable<never> {
    let errorMessage = 'An error occurred';

    if (error.error?.message) {
      errorMessage = error.error.message;
    } else if (error.message) {
      errorMessage = error.message;
    }

    console.error('Auth Error:', error);
    return throwError(errorMessage);
  }
}
