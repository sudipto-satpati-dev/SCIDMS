/**
 * UserService
 *
 * create()        → real API  : POST /api/users
 * getAll()        → mock (to be replaced)
 * update()        → mock (to be replaced)
 * toggleStatus()  → mock (to be replaced)
 */

import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

import { MockApiService } from './mock-api.service';
import {
  User,
  CreateUserRequest,
  CreateUserApiResponse,
  UserRole,  
} from '../models/index';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class UserService {

  private readonly usersUrl = `${environment.apiBaseUrl}/api/users`;

  constructor(
    private http: HttpClient,
    private api:  MockApiService,
  ) {}

  // ── Still using mock ──────────────────────────────────────────────────────
  getAll(): Observable<User[]>                          { return this.api.getUsers(); }
  update(id: number, data: Partial<User>): Observable<User> { return this.api.updateUser(id, data); }
  toggleStatus(id: number): Observable<User>            { return this.api.toggleUserStatus(id); }

  // ── Real API ──────────────────────────────────────────────────────────────

  /**
   * POST /api/users
   * Payload: { username, email, password, role }
   * Maps the response envelope back to the internal User model.
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
            id:        d.id,
            username:  data.username,   // API doesn't echo username, keep from request
            email:     d.email,
            role:      d.role as UserRole,
            status:    d.status as 'Active' | 'Inactive',
            createdAt: d.createdAt,
          };
          return user;
        }),
        catchError((err: HttpErrorResponse | { message: string }) => {
          if (err instanceof HttpErrorResponse) {
            const msg =
              err.error?.message ||
              (err.status === 409 ? 'Username or email already exists.' :
               err.status === 400 ? 'Invalid user data. Please check the form.' :
               err.status === 403 ? 'You do not have permission to create users.' :
               err.status === 0   ? 'Cannot connect to server. Please try again.' :
               'An unexpected error occurred.');
            return throwError(() => ({ message: msg }));
          }
          return throwError(() => err);
        }),
      );
  }
}
