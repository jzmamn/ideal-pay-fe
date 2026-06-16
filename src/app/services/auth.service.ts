import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { Router } from '@angular/router';
import { API_BASE_URL } from '../api-url.token';

export interface AuthUser {
  accessToken: string;
  refreshToken: string;
  userId: number;
  userName: string;
  name: string;
  companyId: number | null;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const USER_KEY = 'auth_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly baseUrl = inject(API_BASE_URL);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  private readonly isLoggedIn$ = new BehaviorSubject<boolean>(this.hasValidToken());

  // ── Public API ─────────────────────────────────────────────────────────────

  login(username: string, password: string): Observable<boolean> {
    return this.http
      .post<ApiResponse<AuthUser>>(`${this.baseUrl}/auth/login`, { username, password })
      .pipe(
        tap(res => {
          if (res.success) {
            this.storeTokens(res.data.accessToken, res.data.refreshToken);
            this.storeUser(res.data);
            this.isLoggedIn$.next(true);
          }
        }),
        map(res => res.success),
        catchError(() => {
          this.isLoggedIn$.next(false);
          return throwError(() => new Error('Invalid credentials'));
        }),
      );
  }

  logout(): void {
    const accessToken = this.getAccessToken();
    const headers = new HttpHeaders(accessToken ? { Authorization: `Bearer ${accessToken}` } : {});
    this.http
      .post(`${this.baseUrl}/auth/logout`, {}, { headers })
      .subscribe({ error: () => {} }); // fire-and-forget; clear locally regardless
    this.clearSession();
    this.router.navigate(['/login']);
  }

  refreshToken(): Observable<string> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) return throwError(() => new Error('No refresh token'));

    return this.http
      .post<ApiResponse<AuthUser>>(`${this.baseUrl}/auth/refresh`, { refreshToken })
      .pipe(
        tap(res => {
          if (res.success) {
            this.storeTokens(res.data.accessToken, res.data.refreshToken);
          }
        }),
        map(res => res.data.accessToken),
        catchError(err => {
          this.clearSession();
          this.router.navigate(['/login']);
          return throwError(() => err);
        }),
      );
  }

  isAuthenticated(): boolean {
    return this.isLoggedIn$.value;
  }

  getAccessToken(): string | null {
    if (!this.isBrowser) return null;
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    if (!this.isBrowser) return null;
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }

  getCurrentUser(): AuthUser | null {
    if (!this.isBrowser) return null;
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  private hasValidToken(): boolean {
    return this.isBrowser && !!localStorage.getItem(ACCESS_TOKEN_KEY);
  }

  private storeTokens(access: string, refresh: string): void {
    if (!this.isBrowser) return;
    localStorage.setItem(ACCESS_TOKEN_KEY, access);
    localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
  }

  private storeUser(user: AuthUser): void {
    if (!this.isBrowser) return;
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  private clearSession(): void {
    if (!this.isBrowser) return;
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.isLoggedIn$.next(false);
  }
}
