import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { catchError, tap, share, map } from 'rxjs/operators';

export interface CacheItem<T> {
  data: T;
  timestamp: number;
  loading: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class DataCacheService {
  private readonly apiUrl = 'http://localhost:3000/api/v1';
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  // Cache subjects
  private projectsCache$ = new BehaviorSubject<CacheItem<any[]>>({
    data: [],
    timestamp: 0,
    loading: false,
  });

  private tasksCache$ = new BehaviorSubject<CacheItem<any[]>>({
    data: [],
    timestamp: 0,
    loading: false,
  });

  private timeEntriesCache$ = new BehaviorSubject<CacheItem<any[]>>({
    data: [],
    timestamp: 0,
    loading: false,
  });

  private teamCache$ = new BehaviorSubject<CacheItem<any[]>>({
    data: [],
    timestamp: 0,
    loading: false,
  });

  private overviewCache$ = new BehaviorSubject<CacheItem<any>>({
    data: null,
    timestamp: 0,
    loading: false,
  });

  // Ongoing requests to prevent duplicates
  private ongoingRequests = new Map<string, Observable<any>>();

  constructor(private http: HttpClient) {}

  /**
   * Get projects with caching
   */
  getProjects(): Observable<any[]> {
    const cache = this.projectsCache$.value;

    // Return cached data if still valid
    if (this.isCacheValid(cache.timestamp) && cache.data.length > 0) {
      console.log('📦 Returning cached projects');
      return of(cache.data);
    }

    // Return ongoing request if already in progress
    if (this.ongoingRequests.has('projects')) {
      console.log('⏳ Returning ongoing projects request');
      return this.ongoingRequests.get('projects')!;
    }

    console.log('🌐 Fetching fresh projects data');

    // Set loading state
    this.projectsCache$.next({
      ...cache,
      loading: true,
    });

    const request$ = this.http.get<any>(`${this.apiUrl}/projects`, { withCredentials: true }).pipe(
      tap((data) => {
        // Handle both direct array and wrapped data
        const projectsArray = Array.isArray(data) ? data : data.projects || [];

        this.projectsCache$.next({
          data: projectsArray,
          timestamp: Date.now(),
          loading: false,
        });

        console.log('✅ Projects cached successfully');
        this.ongoingRequests.delete('projects');
      }),
      catchError((error) => {
        this.projectsCache$.next({
          ...cache,
          loading: false,
        });
        this.ongoingRequests.delete('projects');
        console.error('❌ Error fetching projects:', error);
        return throwError(error);
      }),
      share() // Share the observable to prevent multiple HTTP calls
    );

    this.ongoingRequests.set('projects', request$);
    return request$;
  }

  /**
   * Get tasks with caching
   */
  getTasks(): Observable<any[]> {
    const cache = this.tasksCache$.value;

    if (this.isCacheValid(cache.timestamp) && cache.data.length > 0) {
      console.log('📦 Returning cached tasks');
      return of(cache.data);
    }

    if (this.ongoingRequests.has('tasks')) {
      console.log('⏳ Returning ongoing tasks request');
      return this.ongoingRequests.get('tasks')!;
    }

    console.log('🌐 Fetching fresh tasks data');

    this.tasksCache$.next({
      ...cache,
      loading: true,
    });

    const request$ = this.http.get<any>(`${this.apiUrl}/tasks`, { withCredentials: true }).pipe(
      tap((data) => {
        const tasksArray = Array.isArray(data) ? data : data.tasks || [];

        this.tasksCache$.next({
          data: tasksArray,
          timestamp: Date.now(),
          loading: false,
        });

        console.log('✅ Tasks cached successfully');
        this.ongoingRequests.delete('tasks');
      }),
      catchError((error) => {
        this.tasksCache$.next({
          ...cache,
          loading: false,
        });
        this.ongoingRequests.delete('tasks');
        console.error('❌ Error fetching tasks:', error);
        return throwError(error);
      }),
      share()
    );

    this.ongoingRequests.set('tasks', request$);
    return request$;
  }

  /**
   * Get team members with caching
   */
  getTeamMembers(): Observable<any[]> {
    const cache = this.teamCache$.value;

    if (this.isCacheValid(cache.timestamp) && cache.data.length > 0) {
      console.log('📦 Returning cached team data');
      return of(cache.data);
    }

    if (this.ongoingRequests.has('team')) {
      console.log('⏳ Returning ongoing team request');
      return this.ongoingRequests.get('team')!;
    }

    console.log('🌐 Fetching fresh team data');

    this.teamCache$.next({
      ...cache,
      loading: true,
    });

    const request$ = this.http.get<any>(`${this.apiUrl}/team`, { withCredentials: true }).pipe(
      tap((data) => {
        const teamArray = Array.isArray(data) ? data : data.team || [];

        this.teamCache$.next({
          data: teamArray,
          timestamp: Date.now(),
          loading: false,
        });

        console.log('✅ Team data cached successfully');
        this.ongoingRequests.delete('team');
      }),
      catchError((error) => {
        this.teamCache$.next({
          ...cache,
          loading: false,
        });
        this.ongoingRequests.delete('team');
        console.error('❌ Error fetching team:', error);
        return throwError(error);
      }),
      share()
    );

    this.ongoingRequests.set('team', request$);
    return request$;
  }

  /**
   * Get overview data with caching
   */
  getOverview(): Observable<any> {
    const cache = this.overviewCache$.value;

    if (this.isCacheValid(cache.timestamp) && cache.data) {
      console.log('📦 Returning cached overview');
      return of(cache.data);
    }

    if (this.ongoingRequests.has('overview')) {
      console.log('⏳ Returning ongoing overview request');
      return this.ongoingRequests.get('overview')!;
    }

    console.log('🌐 Fetching fresh overview data');

    this.overviewCache$.next({
      ...cache,
      loading: true,
    });

    const request$ = this.http.get<any>(`${this.apiUrl}/overview`, { withCredentials: true }).pipe(
      tap((data) => {
        this.overviewCache$.next({
          data: data,
          timestamp: Date.now(),
          loading: false,
        });

        console.log('✅ Overview cached successfully');
        this.ongoingRequests.delete('overview');
      }),
      catchError((error) => {
        this.overviewCache$.next({
          ...cache,
          loading: false,
        });
        this.ongoingRequests.delete('overview');
        console.error('❌ Error fetching overview:', error);
        return throwError(error);
      }),
      share()
    );

    this.ongoingRequests.set('overview', request$);
    return request$;
  }

  /**
   * Get loading state observables
   */
  getProjectsLoading(): Observable<boolean> {
    return this.projectsCache$.pipe(map((cache: CacheItem<any[]>) => cache.loading));
  }

  getTasksLoading(): Observable<boolean> {
    return this.tasksCache$.pipe(map((cache: CacheItem<any[]>) => cache.loading));
  }

  /**
   * Invalidate specific cache
   */
  invalidateProjects(): void {
    this.projectsCache$.next({
      data: [],
      timestamp: 0,
      loading: false,
    });
    console.log('🗑️ Projects cache invalidated');
  }

  invalidateTasks(): void {
    this.tasksCache$.next({
      data: [],
      timestamp: 0,
      loading: false,
    });
    console.log('🗑️ Tasks cache invalidated');
  }

  invalidateTeam(): void {
    this.teamCache$.next({
      data: [],
      timestamp: 0,
      loading: false,
    });
    console.log('🗑️ Team cache invalidated');
  }

  /**
   * Clear all caches
   */
  clearAllCaches(): void {
    this.invalidateProjects();
    this.invalidateTasks();
    this.invalidateTeam();
    this.invalidateTimeEntries();
    this.overviewCache$.next({
      data: null,
      timestamp: 0,
      loading: false,
    });
    this.ongoingRequests.clear();
    console.log('🗑️ All caches cleared');
  }

  /**
   * Get time entries with caching
   */
  getTimeEntries(): Observable<any> {
    const cache = this.timeEntriesCache$.getValue();

    // Return cached data if valid and not loading
    if (cache.data && this.isCacheValid(cache.timestamp) && !cache.loading) {
      console.log('📋 Returning cached time entries');
      return of(cache.data);
    }

    // Return ongoing request if already in progress
    if (this.ongoingRequests.has('timeEntries')) {
      console.log('⏳ Returning ongoing time entries request');
      return this.ongoingRequests.get('timeEntries')!;
    }

    console.log('🌐 Fetching fresh time entries data');

    // Set loading state
    this.timeEntriesCache$.next({
      ...cache,
      loading: true,
    });

    const request$ = this.http
      .get<any>(`${this.apiUrl}/time-entries`, { withCredentials: true })
      .pipe(
        tap((data) => {
          // Handle both direct array and wrapped data
          const entriesArray = Array.isArray(data) ? data : data.entries || [];

          this.timeEntriesCache$.next({
            data: entriesArray,
            timestamp: Date.now(),
            loading: false,
          });

          console.log('✅ Time entries cached successfully');
          this.ongoingRequests.delete('timeEntries');
        }),
        catchError((error) => {
          this.timeEntriesCache$.next({
            ...cache,
            loading: false,
          });
          this.ongoingRequests.delete('timeEntries');
          console.error('❌ Error fetching time entries:', error);
          return throwError(error);
        }),
        share() // Share the observable to prevent multiple HTTP calls
      );

    // Store the ongoing request
    this.ongoingRequests.set('timeEntries', request$);
    return request$;
  }

  /**
   * Invalidate time entries cache
   */
  invalidateTimeEntries(): void {
    this.timeEntriesCache$.next({
      data: [],
      timestamp: 0,
      loading: false,
    });
    console.log('🗑️ Time entries cache invalidated');
  }

  /**
   * Check if cache is still valid
   */
  private isCacheValid(timestamp: number): boolean {
    return Date.now() - timestamp < this.CACHE_DURATION;
  }
}
