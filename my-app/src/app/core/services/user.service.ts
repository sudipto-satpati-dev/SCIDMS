/**
 * UserService
 *
 * getAll()        → real API  : GET  /api/users  (with optional filters/pagination)
 * create()        → real API  : POST /api/users (with audit log trigger)
 * update()        → real API  : PUT /api/users/{id} (with audit log trigger)
 * toggleStatus()  → real API  : PATCH /api/users/{id}/status (with audit log trigger)
 */

import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { AuditService } from './audit.service';
import {
  User,
  UserRole,
  CreateUserRequest,
  CreateUserApiResponse,
  UpdateUserRequest,
  UpdateUserApiResponse,
  UserListParams,
  UserListApiResponse,
  ToggleUserStatusRequest,
  ToggleUserStatusApiResponse,
  ArchiveUserApiResponse,
} from '../models/index';
import { environment } from '../../../environments/environment';

/** Paginated result returned by getAll() */
export interface UserListResult {
  users: User[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

@Injectable({ providedIn: 'root' })
export class UserService {

  private readonly usersUrl = `${environment.apiBaseUrl}/api/users`;

  constructor(
    private http: HttpClient,
    private auditService: AuditService
  ) { }

  /**
   * PATCH /api/users/{id}/archive
   */
  archive(id: number): Observable<User> {
    return this.http
      .patch<ArchiveUserApiResponse>(`${this.usersUrl}/${id}/archive`, {})
      .pipe(
        map(res => {
          if (!res.success) {
            throw { message: res.message || 'Failed to archive user.' };
          }
          const d = res.data;
          const user: User = {
            id: d.id,
            username: d.username,
            email: d.email,
            role: d.role as UserRole,
            status: d.status as 'Active' | 'Inactive',
            createdAt: d.createdAt,
          };

          // Record Audit Log for Archiving User
          this.auditService.createAuditLog({
            action: 'USER_STATUS_CHANGED',
            module: 'USER_MANAGEMENT',
            entityType: 'USER',
            entityId: d.id,
            description: `Archived user ${d.username} (ID #${d.id})`
          }).subscribe({ next: () => {}, error: () => {} });

          return user;
        }),
        catchError(this._handleError),
      );
  }

  /**
   * PATCH /api/users/{id}/status
   */
  toggleStatus(id: number, currentStatus: 'Active' | 'Inactive'): Observable<User> {
    const next: ToggleUserStatusRequest = {
      status: currentStatus === 'Active' ? 'INACTIVE' : 'ACTIVE',
    };
    return this.http
      .patch<ToggleUserStatusApiResponse>(`${this.usersUrl}/${id}/status`, next)
      .pipe(
        map(res => {
          if (!res.success) {
            throw { message: res.message || 'Failed to update user status.' };
          }
          const d = res.data;
          const user: User = {
            id: d.id,
            username: d.username,
            email: d.email,
            role: d.role as UserRole,
            status: d.status === 'ACTIVE' ? 'Active' : 'Inactive',
            createdAt: d.createdAt,
          };

          // Record Audit Log for User Status Toggle
          this.auditService.createAuditLog({
            action: 'USER_STATUS_CHANGED',
            module: 'USER_MANAGEMENT',
            entityType: 'USER',
            entityId: d.id,
            description: `Toggled user status for ${d.username} to ${d.status}`
          }).subscribe({ next: () => {}, error: () => {} });

          return user;
        }),
        catchError(this._handleError),
      );
  }

  /**
   * PUT /api/users/{id}
   */
  update(id: number, data: UpdateUserRequest): Observable<User> {
    const payload: Partial<UpdateUserRequest> = { username: data.username, email: data.email };
    if (data.role !== 'ADMIN') payload.role = data.role;

    return this.http
      .put<UpdateUserApiResponse>(`${this.usersUrl}/${id}`, payload)
      .pipe(
        map(res => {
          if (!res.success) {
            throw { message: res.message || 'Failed to update user.' };
          }
          const d = res.data;
          const user: User = {
            id: d.id,
            username: d.username,
            email: d.email,
            role: d.role as UserRole,
            status: d.status as 'Active' | 'Inactive',
            createdAt: d.createdAt,
          };

          // Record Audit Log for User Update
          this.auditService.createAuditLog({
            action: 'USER_UPDATED',
            module: 'USER_MANAGEMENT',
            entityType: 'USER',
            entityId: d.id,
            description: `Updated profile details for user ${d.username} (${d.email})`
          }).subscribe({ next: () => {}, error: () => {} });

          return user;
        }),
        catchError(this._handleError),
      );
  }

  /**
   * GET /api/users
   */
  getAll(params: UserListParams = {}): Observable<UserListResult> {
    let httpParams = new HttpParams();
    if (params.search) httpParams = httpParams.set('search', params.search);
    if (params.role) httpParams = httpParams.set('role', params.role);
    if (params.status) httpParams = httpParams.set('status', params.status);
    if (params.sort) httpParams = httpParams.set('sort', params.sort);
    if (params.page != null) httpParams = httpParams.set('page', params.page.toString());
    if (params.size != null) httpParams = httpParams.set('size', params.size.toString());

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
              id: u.id,
              username: u.username,
              email: u.email,
              role: u.role as UserRole,
              status: u.status as 'Active' | 'Inactive',
              createdAt: u.createdAt,
              hasChangedPassword: u.hasChangedPassword,
            } as User)),
            page: d.page,
            size: d.size,
            totalElements: d.totalElements,
            totalPages: d.totalPages,
          };
        }),
        catchError(this._handleError),
      );
  }

  /**
   * POST /api/users
   * Triggers POST /api/audit/log with action USER_CREATED and module USER_MANAGEMENT
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
          const user: User = {
            id: d.id,
            username: data.username,
            email: d.email,
            role: d.role as UserRole,
            status: d.status as 'Active' | 'Inactive',
            createdAt: d.createdAt,
          };

          // Record Audit Log for User Creation
          this.auditService.createAuditLog({
            action: 'USER_CREATED',
            module: 'USER_MANAGEMENT',
            entityType: 'USER',
            entityId: d.id,
            description: `Created new user ${data.username} (${data.email}) as ${data.role}`
          }).subscribe({
            next: () => {},
            error: (e) => console.warn('Audit log trigger failed for user creation:', e)
          });

          return user;
        }),
        catchError(this._handleError),
      );
  }

  private _handleError(err: HttpErrorResponse | { message: string }) {
    if (err instanceof HttpErrorResponse) {
      const msg =
        err.error?.message ||
        (err.status === 409 ? 'Username or email already exists.' :
          err.status === 400 ? 'Invalid request. Please check the form.' :
            err.status === 403 ? 'You do not have permission to perform this action.' :
              err.status === 0 ? 'Cannot connect to server. Please try again.' :
                'An unexpected error occurred.');
      return throwError(() => ({ message: msg }));
    }
    return throwError(() => err);
  }
}
