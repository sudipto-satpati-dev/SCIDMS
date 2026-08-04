import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { MockApiService } from './mock-api.service';
import { DashboardSummaryApiResponse, DashboardSummaryData, DashboardStats } from '../models/index';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly summaryUrl = `${environment.apiBaseUrl}/api/dashboard/summary`;

  constructor(
    private http: HttpClient,
    private api: MockApiService
  ) {}

  /**
   * GET /api/dashboard/summary
   */
  getSummary(): Observable<DashboardSummaryData> {
    return this.http
      .get<DashboardSummaryApiResponse>(this.summaryUrl)
      .pipe(
        map(res => {
          if (!res.success) {
            throw { message: res.message || 'Failed to fetch dashboard summary.' };
          }
          return res.data;
        }),
        catchError(this._handleError)
      );
  }

  /** Backward compatibility fallback */
  getStats(): Observable<DashboardStats> {
    return this.api.getDashboard();
  }

  private _handleError(err: HttpErrorResponse | { message: string }) {
    if (err instanceof HttpErrorResponse) {
      const msg = err.error?.message || 'Failed to connect to dashboard API.';
      return throwError(() => ({ message: msg }));
    }
    return throwError(() => err);
  }
}
