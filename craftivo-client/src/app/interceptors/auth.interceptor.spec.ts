import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { HTTP_INTERCEPTORS, HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthInterceptor } from './auth.interceptor';
import { AuthService } from '../services/auth.service';

describe('AuthInterceptor', () => {
  let interceptor: AuthInterceptor;
  let authService: jasmine.SpyObj<AuthService>;
  let httpClient: HttpClient;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['logout', 'getToken']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        AuthInterceptor,
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy },
        {
          provide: HTTP_INTERCEPTORS,
          useClass: AuthInterceptor,
          multi: true,
        },
      ],
    });

    interceptor = TestBed.inject(AuthInterceptor);
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    httpClient = TestBed.inject(HttpClient);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should be created', () => {
    expect(interceptor).toBeTruthy();
  });

  it('should add withCredentials and headers (token absent)', () => {
    (authService.getToken as jasmine.Spy).and.returnValue(null);
    httpClient.get('/test-no-token').subscribe();

    const req = httpTestingController.expectOne('/test-no-token');
    expect(req.request.withCredentials).toBe(true);
    expect(req.request.headers.get('Content-Type')).toBe('application/json');
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush({ ok: true });
  });

  it('should add Authorization header when token present', () => {
    (authService.getToken as jasmine.Spy).and.returnValue('abc123');
    httpClient.get('/token-test').subscribe();
    const req = httpTestingController.expectOne('/token-test');
    expect(req.request.headers.get('Authorization')).toBe('Bearer abc123');
    req.flush({ ok: true });
  });

  it('should handle 401 errors by calling logout', () => {
    (authService.getToken as jasmine.Spy).and.returnValue('abc123');
    authService.logout.and.stub();

    httpClient.get('/unauthorized').subscribe({
      error: () => {},
    });

    const req = httpTestingController.expectOne('/unauthorized');
    req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

    expect(authService.logout).toHaveBeenCalled();
  });
});
