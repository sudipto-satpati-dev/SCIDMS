import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { MockApiService } from './mock-api.service';
import {
  ApiAuditLog,
  AuditLogListParams,
  AuditLogListApiResponse,
  AuditLogListResult,
  CreateAuditLogRequest,
  CreateAuditLogApiResponse
} from '../models/index';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuditService {
  private readonly logsUrl   = `${environment.apiBaseUrl}/api/audit/logs`;
  private readonly createUrl = `${environment.apiBaseUrl}/api/audit/log`;

  constructor(
    private http: HttpClient,
    private api: MockApiService
  ) {}

  /**
   * GET /api/audit/logs
   * Query params: search, action, module, entityType, entityId, page, size, sort
   */
  getAuditLogs(params: AuditLogListParams = {}): Observable<AuditLogListResult> {
    let httpParams = new HttpParams();
    if (params.search)     httpParams = httpParams.set('search', params.search);
    if (params.action)     httpParams = httpParams.set('action', params.action);
    if (params.module)     httpParams = httpParams.set('module', params.module);
    if (params.entityType) httpParams = httpParams.set('entityType', params.entityType);
    if (params.entityId != null) httpParams = httpParams.set('entityId', params.entityId.toString());
    if (params.page != null)     httpParams = httpParams.set('page', params.page.toString());
    if (params.size != null)     httpParams = httpParams.set('size', params.size.toString());
    if (params.sort)       httpParams = httpParams.set('sort', params.sort);

    return this.http
      .get<AuditLogListApiResponse>(this.logsUrl, { params: httpParams })
      .pipe(
        map(res => {
          if (!res.success) {
            throw { message: res.message || 'Failed to fetch audit logs.' };
          }
          const d = res.data;
          return {
            auditlogs: d.auditlogs || [],
            page: d.page ?? 0,
            size: d.size ?? 0,
            totalElements: d.totalElements ?? 0,
            totalPages: d.totalPages ?? 0,
          };
        }),
        catchError(this._handleError)
      );
  }

  /**
   * POST /api/audit/log
   */
  createAuditLog(req: CreateAuditLogRequest): Observable<ApiAuditLog> {
    return this.http
      .post<CreateAuditLogApiResponse>(this.createUrl, req)
      .pipe(
        map(res => {
          if (!res.success) {
            throw { message: res.message || 'Failed to create audit log entry.' };
          }
          return res.data;
        }),
        catchError(this._handleError)
      );
  }

  /** Backward compatibility */
  getAll(): Observable<any[]> {
    return this.api.getAuditLogs();
  }

  private _handleError(err: HttpErrorResponse | { message: string }) {
    if (err instanceof HttpErrorResponse) {
      const msg = err.error?.message || 'Failed to communicate with audit service.';
      return throwError(() => ({ message: msg }));
    }
    return throwError(() => err);
  }
}
