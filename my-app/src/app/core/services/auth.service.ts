/**
 * AuthService — JWT authentication + RBAC session management.
 *
 * Login calls POST /api/auth/login and stores the JWT in localStorage.
 * The AuthInterceptor automatically attaches it as Bearer on every request.
 * The AuthGuard uses isLoggedIn to protect routes.
 */

import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { User, UserRole, LoginApiResponse } from '../models/index';
import { environment } from '../../../environments/environment';

// ── BRD-defined role → allowed route prefixes ────────────────────────────────
// FR003 / FR004 / BR003: RBAC — only permitted functions accessible per role
export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  'ADMIN': [
    'dashboard', 'products', 'warehouses', 'inventory',
    'orders', 'shipments', 'reports', 'audit', 'users',
  ],
  'MANAGER': [
    'dashboard', 'products', 'warehouses', 'inventory',
    'orders', 'shipments', 'reports', 'audit',
  ],
  'WAREHOUSE MANAGER': [
    'dashboard', 'products', 'warehouses', 'inventory', 'reports',
  ],
  'SALES EXECUTIVE': [
    'dashboard', 'products', 'orders', 'reports',
  ],
  'DISTRIBUTION MANAGER': [
    'dashboard', 'products', 'orders', 'shipments', 'reports',
  ],
  'PRODUCT MANAGER': [
    'dashboard', 'products', 'reports',
  ],
};

// Default landing route per role after login
export const ROLE_HOME: Record<UserRole, string> = {
  'ADMIN':                '/dashboard',
  'MANAGER':              '/dashboard',
  'WAREHOUSE MANAGER':    '/inventory',
  'SALES EXECUTIVE':      '/orders',
  'DISTRIBUTION MANAGER': '/shipments',
  'PRODUCT MANAGER':      '/products',
};

const SESSION_KEY = 'scidms_user';
const TOKEN_KEY   = 'scidms_token';

@Injectable({ providedIn: 'root' })
export class AuthService {

  private readonly loginUrl = `${environment.apiBaseUrl}/api/auth/login`;
  private _currentUser: User | null = null;

  constructor(private http: HttpClient, private router: Router) {
    this._restoreSession();
  }

  // ── Public API ────────────────────────────────────────────────────────────

  get currentUser(): User | null { return this._currentUser; }
  get isLoggedIn():  boolean     { return !!this._currentUser; }
  get role():        UserRole | null { return this._currentUser?.role ?? null; }
  get token():       string | null   { return localStorage.getItem(TOKEN_KEY); }

  /**
   * Real HTTP login — POST /api/auth/login
   * Maps the API response to the internal User model and stores the session.
   */
  login(usernameOrEmail: string, password: string): Observable<User> {
    return this.http
      .post<LoginApiResponse>(this.loginUrl, { usernameOrEmail, password })
      .pipe(
        map(res => {
          if (!res.success) {
            throw { message: res.message || 'Login failed.' };
          }
          const d = res.data;
          // Map API response → internal User model
          const user: User = {
            id:        d.userId,
            username:  d.username,
            email:     d.email,
            role:      d.role as UserRole,
            status:    'Active',
          };
          const token = `${d.tokenType} ${d.token}`;
          this._saveSession(user, token);
          return user;
        }),
        catchError((err: HttpErrorResponse | { message: string }) => {
          // Handle HTTP errors (4xx, 5xx) and thrown objects
          if (err instanceof HttpErrorResponse) {
            const msg = err.error?.message || err.error?.data?.message
              || (err.status === 401 ? 'Invalid username or password.'
                : err.status === 0   ? 'Cannot connect to server. Please try again.'
                : 'An unexpected error occurred.');
            return throwError(() => ({ message: msg }));
          }
          return throwError(() => err);
        }),
      );
  }

  logout(): void {
    this._clearSession();
    this.router.navigate(['/auth/login']);
  }

  /**
   * RBAC check — can the current user access a given route segment?
   * Used by AuthGuard and the sidebar to hide/show nav items.
   */
  canAccess(routeSegment: string): boolean {
    if (!this._currentUser) return false;
    const allowed = ROLE_PERMISSIONS[this._currentUser.role] ?? [];
    return allowed.includes(routeSegment);
  }

  /** Returns the home route for the current user's role */
  homeRoute(): string {
    if (!this._currentUser) return '/auth/login';
    return ROLE_HOME[this._currentUser.role] ?? '/dashboard';
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  private _saveSession(user: User, token: string): void {
    this._currentUser = user;
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    localStorage.setItem(TOKEN_KEY, token);
  }

  private _clearSession(): void {
    this._currentUser = null;
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(TOKEN_KEY);
  }

  private _restoreSession(): void {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (raw) this._currentUser = JSON.parse(raw) as User;
    } catch {
      this._clearSession();
    }
  }
}
