/**
 * AuthService — Mock authentication + RBAC session management.
 *
 * Currently stores the session in localStorage (same as a real JWT app would).
 * MIGRATION: When Spring Boot backend is ready:
 *   1. Replace `mockLogin()` call in `login()` with HttpClient POST to /api/auth/login
 *   2. Store the returned JWT in localStorage under 'scidms_token'
 *   3. The AuthInterceptor (already wired) will attach it to every request automatically
 *   4. Replace `logout()` body with DELETE /api/auth/logout + clearSession()
 *   Everything else (guards, RBAC checks, sidebar) stays the same.
 */

import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import { delay, tap } from 'rxjs/operators';
import { User, UserRole } from '../models/index';

// ── BRD-defined role → allowed route prefixes ────────────────────────────────
// FR003 / FR004 / BR003: RBAC — only permitted functions accessible per role
export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  'Administrator': [
    'dashboard', 'products', 'warehouses', 'inventory',
    'orders', 'shipments', 'reports', 'audit', 'users',
  ],
  'Management': [
    'dashboard', 'products', 'warehouses', 'inventory',
    'orders', 'shipments', 'reports', 'audit',
  ],
  'Warehouse Manager': [
    'dashboard', 'products', 'warehouses', 'inventory', 'reports',
  ],
  'Sales Executive': [
    'dashboard', 'products', 'orders', 'reports',
  ],
  'Distribution Manager': [
    'dashboard', 'products', 'orders', 'shipments', 'reports',
  ],
};

// Default landing route per role after login
export const ROLE_HOME: Record<UserRole, string> = {
  'Administrator':        '/dashboard',
  'Management':           '/dashboard',
  'Warehouse Manager':    '/inventory',
  'Sales Executive':      '/orders',
  'Distribution Manager': '/shipments',
};

// ── Mock user credentials (username → password) ──────────────────────────────
// These match the MOCK_USERS in mock-data.ts
const MOCK_CREDENTIALS: Record<string, string> = {
  'alex.rivera':   'Admin@2026',   // Administrator
  'lindsey.wu':    'Admin@2026',   // Administrator
  'james.wright':  'Manage@2026',  // Management
  'sarah.j_mgmt':  'Warehouse@1',  // Warehouse Manager
  'mark.h_sales':  'Sales@2026',   // Sales Executive  (Inactive — login blocked)
  'ben.kline':     'Sales@2026',   // Sales Executive
  'priya.sharma':  'Distrib@2026', // Distribution Manager
  'nina.patel':    'Warehouse@1',  // Warehouse Manager (Inactive — login blocked)
};

const SESSION_KEY = 'scidms_user';
const TOKEN_KEY   = 'scidms_token';

@Injectable({ providedIn: 'root' })
export class AuthService {

  private _currentUser: User | null = null;

  constructor(private router: Router) {
    // Rehydrate session from localStorage on app boot
    this._restoreSession();
  }

  // ── Public API ────────────────────────────────────────────────────────────

  get currentUser(): User | null { return this._currentUser; }
  get isLoggedIn():  boolean     { return !!this._currentUser; }
  get role():        UserRole | null { return this._currentUser?.role ?? null; }
  get token():       string | null   { return localStorage.getItem(TOKEN_KEY); }

  /**
   * Mock login — simulates a 600ms network call.
   * Returns the User on success, throws {message} on failure.
   * MIGRATION: replace body with HttpClient.post<{token,user}>('/api/auth/login', {username, password})
   */
  login(username: string, password: string): Observable<User> {
    const expectedPwd = MOCK_CREDENTIALS[username];

    if (!expectedPwd || expectedPwd !== password) {
      // BRD BR002 / Exception: invalid credentials
      return throwError(() => ({ message: 'Invalid username or password.' }))
        .pipe(delay(600));
    }

    // Inline mock user data (matches MOCK_USERS in mock-data.ts)
    const mockUsers: User[] = [
      { id: 'USR-1001', username: 'alex.rivera',  email: 'a.rivera@scidms-logistics.com', role: 'Administrator',        status: 'Active',   createdAt: 'Oct 12, 2023' },
      { id: 'USR-1004', username: 'lindsey.wu',    email: 'l.wu@scidms.io',               role: 'Administrator',        status: 'Active',   createdAt: 'Nov 10, 2023' },
      { id: 'USR-1007', username: 'james.wright',  email: 'j.wright@scidms.io',           role: 'Management',           status: 'Active',   createdAt: 'Jan 03, 2024' },
      { id: 'USR-1002', username: 'sarah.j_mgmt',  email: 's.jordan@scidms.io',           role: 'Warehouse Manager',    status: 'Active',   createdAt: 'Oct 15, 2023' },
      { id: 'USR-1003', username: 'mark.h_sales',  email: 'm.hendricks@scidms.io',        role: 'Sales Executive',      status: 'Inactive', createdAt: 'Nov 02, 2023' },
      { id: 'USR-1005', username: 'ben.kline',      email: 'b.kline@scidms.io',           role: 'Sales Executive',      status: 'Active',   createdAt: 'Dec 01, 2023' },
      { id: 'USR-1006', username: 'priya.sharma',   email: 'p.sharma@scidms.io',          role: 'Distribution Manager', status: 'Active',   createdAt: 'Dec 14, 2023' },
      { id: 'USR-1008', username: 'nina.patel',     email: 'n.patel@scidms.io',           role: 'Warehouse Manager',    status: 'Inactive', createdAt: 'Jan 20, 2024' },
    ];

    const user = mockUsers.find(u => u.username === username);
    if (!user) {
      return throwError(() => ({ message: 'Invalid username or password.' })).pipe(delay(600));
    }

    // BRD BR003: inactive accounts cannot log in
    if (user.status === 'Inactive') {
      return throwError(() => ({ message: 'Your account is inactive. Contact your Administrator.' }))
        .pipe(delay(600));
    }

    const mockToken = `mock-jwt.${btoa(JSON.stringify({ sub: user.id, role: user.role }))}.signature`;

    return of(user).pipe(
      delay(600),
      tap(u => this._saveSession(u, mockToken)),
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
