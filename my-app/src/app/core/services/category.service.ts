import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Category, CreateCategoryRequest, CategoryApiResponse } from '../models/index';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private readonly categoriesUrl = `${environment.apiBaseUrl}/api/categories`;

  constructor(private http: HttpClient) {}

  /**
   * GET /api/categories
   * Fetches list of categories from real backend.
   */
  getAll(): Observable<Category[]> {
    return this.http
      .get<CategoryApiResponse<Category[]>>(this.categoriesUrl)
      .pipe(
        map(res => {
          if (!res.success) {
            throw { message: res.message || 'Failed to fetch categories.' };
          }
          return res.data;
        }),
        catchError(this._handleError)
      );
  }

  /**
   * POST /api/categories
   * Body: { name, description }
   * Response: { success, message, data: { id, name, description, status, createdAt, updatedAt } }
   */
  create(data: CreateCategoryRequest): Observable<Category> {
    const payload = {
      name: data.name.trim(),
      description: data.description ? data.description.trim() : ''
    };

    return this.http
      .post<CategoryApiResponse<Category>>(this.categoriesUrl, payload)
      .pipe(
        map(res => {
          if (!res.success) {
            throw { message: res.message || 'Failed to create category.' };
          }
          return res.data;
        }),
        catchError(this._handleError)
      );
  }

  // ── Shared error handler (same pattern as UserService) ───────────────────

  private _handleError(err: HttpErrorResponse | { message: string }) {
    if (err instanceof HttpErrorResponse) {
      const msg =
        err.error?.message ||
        (err.status === 409 ? 'Category name already exists.' :
          err.status === 400 ? 'Invalid category data. Please check the form.' :
            err.status === 403 ? 'You do not have permission to perform this action.' :
              err.status === 0 ? 'Cannot connect to server. Please check your backend.' :
                'An unexpected error occurred.');
      return throwError(() => ({ message: msg }));
    }
    return throwError(() => err);
  }
}
