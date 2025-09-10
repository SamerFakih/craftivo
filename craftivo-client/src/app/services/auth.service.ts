import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
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

  constructor(private http: HttpClient, private router: Router) {
    this.checkAuthStatus();
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

  // Logout
  logout(): Observable<any> {
    return this.http
      .post(
        `${this.apiUrl}/logout`,
        {},
        {
          withCredentials: true,
        }
      )
      .pipe(
        tap(() => this.handleLogout()),
        catchError(() => {
          this.handleLogout();
          return throwError('Logout failed');
        })
      );
  }

  // Check auth status by calling backend
  checkAuthStatus(): void {
    this.http
      .get<{ user: User }>(`${this.apiUrl}`, {
        withCredentials: true,
      })
      .subscribe({
        next: (response) => {
          this.handleAuthSuccess(response.user);
        },
        error: () => {
          this.handleLogout();
        },
      });
  }

  // Get current user from backend
  getCurrentUser(): Observable<User> {
    return this.http
      .get<{ user: User }>(`${this.apiUrl}`, {
        withCredentials: true,
      })
      .pipe(
        map((response) => response.user),
        tap((user) => {
          this.currentUserSubject.next(user);
          this.currentUser.set(user);
        }),
        catchError(this.handleError)
      );
  }

  // Handle successful authentication
  private handleAuthSuccess(user: User): void {
    // Only store non-sensitive user data in localStorage (browser only)
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('currentUser', JSON.stringify(user));
    }

    // Update subjects and signals
    this.currentUserSubject.next(user);
    this.isLoggedInSubject.next(true);
    this.currentUser.set(user);
    this.isLoggedIn.set(true);
  }

  // Handle logout
  private handleLogout(): void {
    // Clear only user data (no tokens to clear, browser only)
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem('currentUser');
    }

    // Reset subjects and signals
    this.currentUserSubject.next(null);
    this.isLoggedInSubject.next(false);
    this.currentUser.set(null);
    this.isLoggedIn.set(false);

    // Redirect to login
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
