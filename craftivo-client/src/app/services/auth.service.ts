import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError, of } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { API_BASE } from './api.config';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar?: string;
}

// Support multiple backend response shapes
export interface AuthResponse {
  user?: User; // when backend returns { user: {...} }
  user_id?: number; // when backend returns lean fields + token
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  access_token?: string;
  message?: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = `${API_BASE}/auth`;
  private readonly TOKEN_KEY = 'auth.token';

  private isLoggedInSubject = new BehaviorSubject<boolean>(false);
  private currentUserSubject = new BehaviorSubject<User | null>(null);

  isLoggedIn$ = this.isLoggedInSubject.asObservable();
  currentUser$ = this.currentUserSubject.asObservable();

  // Signal-based approach
  isLoggedIn = signal(false);
  currentUser = signal<User | null>(null);

  constructor(private http: HttpClient, private router: Router) {}

  // Token helpers (persist across reloads)
  getToken(): string | null {
    try {
      return localStorage.getItem(this.TOKEN_KEY);
    } catch {
      return null;
    }
  }

  private setToken(token: string | null) {
    try {
      if (token) localStorage.setItem(this.TOKEN_KEY, token);
      else localStorage.removeItem(this.TOKEN_KEY);
    } catch {
      // no-op for environments without storage
    }
  }

  // Used by AuthGuard to check auth status and return Observable<boolean>
  public checkAuthStatusGuard(): Observable<boolean> {
    return this.http.get<any>(`${this.apiUrl}/profile`, { withCredentials: true }).pipe(
      map((response: any) => {
        const raw = response.user ? response.user : response;
        const user: User = {
          id: String(raw.id ?? raw.user_id ?? ''),
          email: raw.email ?? '',
          firstName: raw.firstName ?? raw.first_name ?? '',
          lastName: raw.lastName ?? raw.last_name ?? '',
          avatar: raw.avatar,
        };
        console.debug('[Auth] Guard profile loaded:', user);
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
        tap((response) => this.processAuthResponse(response)),
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
        tap((response) => this.processAuthResponse(response)),
        catchError(this.handleError)
      );
  }

  // Normalize backend auth response, store token, and set user
  private processAuthResponse(resp: AuthResponse) {
    // Prefer explicit user if provided
    let user: User | null = null;

    // If backend returned nested user, normalize it
    if (resp.user) {
      const raw: any = resp.user;
      user = {
        id: String(raw.id ?? raw.user_id ?? ''),
        email: raw.email ?? resp.email ?? '',
        firstName: raw.firstName ?? raw.first_name ?? resp.firstName ?? '',
        lastName: raw.lastName ?? raw.last_name ?? resp.lastName ?? '',
        avatar: raw.avatar,
      };
    } else {
      // Flat response variant
      const id = resp.user_id != null ? String(resp.user_id) : undefined;
      if (id && (resp.email || (resp as any).email)) {
        user = {
          id,
          // prefer explicit resp.email, fall back to any email property
          email: resp.email || (resp as any).email || '',
          firstName: resp.firstName || (resp as any).first_name || '',
          lastName: resp.lastName || (resp as any).last_name || '',
        };
      }
    }
    // Store token if present
    if (resp.access_token) {
      this.setToken(resp.access_token);
    }
    if (user) this.handleAuthSuccess(user);
  }

  // Handle successful authentication
  private handleAuthSuccess(user: User): void {
    this.isLoggedIn.set(true);
    this.currentUser.set(user);
    // Keep BehaviorSubjects in sync
    this.isLoggedInSubject.next(true);
    this.currentUserSubject.next(user);
  }

  // Check authentication status from backend (restore state)
  checkAuthStatus(): void {
    this.http.get<any>(`${this.apiUrl}/profile`, { withCredentials: true }).subscribe({
      next: (response) => {
        // Support both { user: ... } and plain user object; normalize snake_case
        const raw = response.user ? response.user : response;
        const user: User = {
          id: String(raw.id ?? raw.user_id ?? ''),
          email: raw.email ?? '',
          firstName: raw.firstName ?? raw.first_name ?? '',
          lastName: raw.lastName ?? raw.last_name ?? '',
          avatar: raw.avatar,
        };
        this.isLoggedIn.set(true);
        this.currentUser.set(user);
        // Keep BehaviorSubjects in sync
        this.isLoggedInSubject.next(true);
        this.currentUserSubject.next(user);
      },
      error: () => {
        this.isLoggedIn.set(false);
        this.currentUser.set(null);
        // Keep BehaviorSubjects in sync
        this.isLoggedInSubject.next(false);
        this.currentUserSubject.next(null);
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
    this.setToken(null);
    this.isLoggedIn.set(false);
    this.currentUser.set(null);
    // Keep BehaviorSubjects in sync
    this.isLoggedInSubject.next(false);
    this.currentUserSubject.next(null);
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
    return throwError(() => errorMessage);
  }
}
