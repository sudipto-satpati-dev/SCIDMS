/**
 * UserService
 *
 * getAll()        → real API  : GET  /api/users  (with optional filters/pagination)
 * create()        → real API  : POST /api/users
 * update()        → mock (to be replaced)
 * toggleStatus()  → mock (to be replaced)
 */

import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

import { MockApiService } from './mock-api.service';
import {
  User,
  UserRole,
  CreateUserRequest,
  CreateUserApiResponse,
  UserListParams,
  UserListApiResponse,
} from '../models/index';
import { environment } from '../../../environments/environment';

/** Paginated result returned by getAll() */
export interface UserListResult {
  users:         User[];
  page:          number;
  size:          number;
  totalElements: number;
  totalPages:    number;
}
@Injectable({ providedIn: 'root' })
export class UserService {

  private readonly usersUrl = `${environment.apiBaseUrl}/api/users`;

  constructor(
    private http: HttpClient,
    private api:  MockApiService,   // remove once update() & toggleStatus() are real
  ) {}

  // ── Still using mock ──────────────────────────────────────────────────────
  update(id: number, data: Partial<User>): Observable<User>  { return this.api.updateUser(id, data); }
  toggleStatus(id: number): Observable<User>                 { return this.api.toggleUserStatus(id); }

  // ── Real API ──────────────────────────────────────────────────────────────

  /**
   * GET /api/users
   * All params are optional — pass only what you need.
   * Examples:
   *   getAll()                                  → all users (default page/size)
   *   getAll({ role: 'ADMIN' })                 → filter by role
   *   getAll({ status: 'Active' })              → filter by status
   *   getAll({ search: 'john' })                → search by name/username
   *   getAll({ page: 0, size: 10, sort: 'createdAt,desc' })
   */
  getAll(params: UserListParams = {}): Observable<UserListResult> {
    let httpParams = new HttpParams();
    if (params.search)  httpParams = httpParams.set('search',  params.search);
    if (params.role)    httpParams = httpParams.set('role',    params.role);
    if (params.status)  httpParams = httpParams.set('status',  params.status);
    if (params.sort)    httpParams = httpParams.set('sort',    params.sort);
    if (params.page  != null) httpParams = httpParams.set('page', params.page.toString());
    if (params.size  != null) httpParams = httpParams.set('size', params.size.toString());

    return this.http
      .get<UserListApiResponse>(this.usersUrl, { params: httpParams })
      .pipe(
        map(res => {
          if (!res.success) {
            throw { message: res.message || 'Failed to load users.' };
          }
          const d = res.data;
          return {
            users: d.users.map(u => ({
              id:        u.id,
              username:  u.username,
              email:     u.email,
              role:      u.role as UserRole,
              status:    u.status as 'Active' | 'Inactive',
              createdAt: u.createdAt,
            } as User)),
            page:          d.page,
            size:          d.size,
            totalElements: d.totalElements,
            totalPages:    d.totalPages,
          };
        }),
        catchError(this._handleError),
      );
  }

  /**
   * POST /api/users
   * Payload: { username, email, password, role }
   */
  create(data: CreateUserRequest): Observable<User> {
    return this.http
      .post<CreateUserApiResponse>(this.usersUrl, data)
      .pipe(
        map(res => {
          if (!res.success) {
            throw { message: res.message || 'Failed to create user.' };
          }
          const d = res.data;
          return {
            id:        d.id,
            username:  data.username,
            email:     d.email,
            role:      d.role as UserRole,
            status:    d.status as 'Active' | 'Inactive',
            createdAt: d.createdAt,
          } as User;
        }),
        catchError(this._handleError),
      );
  }

  // ── Shared error handler ──────────────────────────────────────────────────

  private _handleError(err: HttpErrorResponse | { message: string }) {
    if (err instanceof HttpErrorResponse) {
      const msg =
        err.error?.message ||
        (err.status === 409 ? 'Username or email already exists.'  :
         err.status === 400 ? 'Invalid request. Please check the form.' :
         err.status === 403 ? 'You do not have permission to perform this action.' :
         err.status === 0   ? 'Cannot connect to server. Please try again.' :
         'An unexpected error occurred.');
      return throwError(() => ({ message: msg }));
    }
    return throwError(() => err);
  }
}
