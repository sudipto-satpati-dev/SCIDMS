import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import {
  Warehouse,
  WarehouseStatus,
  CreateWarehouseRequest,
  UpdateWarehouseRequest,
  ToggleWarehouseStatusRequest,
  AssignWarehouseManagerRequest,
  WarehouseListParams,
  WarehouseListApiResponse,
  SingleWarehouseApiResponse,
  WarehouseListResult,
} from '../models/index';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class WarehouseService {
  private readonly warehousesUrl = `${environment.apiBaseUrl}/api/warehouses`;
  private readonly warehouseCreateUrl = `${environment.apiBaseUrl}/api/warehouse`;

  constructor(private http: HttpClient) {}

  /**
   * GET /api/warehouses
   * Query params: search, status, page, size, sort
   */
  getAll(params: WarehouseListParams = {}): Observable<WarehouseListResult> {
    let httpParams = new HttpParams();
    if (params.search) httpParams = httpParams.set('search', params.search);
    if (params.status) httpParams = httpParams.set('status', params.status);
    if (params.sort) httpParams = httpParams.set('sort', params.sort);
    if (params.page != null) httpParams = httpParams.set('page', params.page.toString());
    if (params.size != null) httpParams = httpParams.set('size', params.size.toString());

    return this.http
      .get<WarehouseListApiResponse>(this.warehousesUrl, { params: httpParams })
      .pipe(
        map(res => {
          if (!res.success) {
            throw { message: res.message || 'Failed to fetch warehouses.' };
          }
          const d = res.data;
          return {
            warehouses: d.warehouses || [],
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
   * POST /api/warehouse
   * Request body: { name, location, totalCapacity }
   * Response: { success, message, timestamp, data: Warehouse }
   */
  create(data: CreateWarehouseRequest): Observable<Warehouse> {
    return this.http
      .post<SingleWarehouseApiResponse>(this.warehouseCreateUrl, data)
      .pipe(
        map(res => {
          if (!res.success) {
            throw { message: res.message || 'Failed to create warehouse.' };
          }
          return res.data;
        }),
        catchError(this._handleError)
      );
  }

  /**
   * PUT /api/warehouses/{id}
   * Request body: { name, location, totalCapacity }
   * Response: { success, message, timestamp, data: Warehouse }
   */
  update(id: number, data: UpdateWarehouseRequest): Observable<Warehouse> {
    return this.http
      .put<SingleWarehouseApiResponse>(`${this.warehousesUrl}/${id}`, data)
      .pipe(
        map(res => {
          if (!res.success) {
            throw { message: res.message || 'Failed to update warehouse.' };
          }
          return res.data;
        }),
        catchError(this._handleError)
      );
  }

  /**
   * PATCH /api/warehouses/{id}/status
   * Request body: { status: 'ACTIVE' | 'INACTIVE' }
   * Response: { success, message, timestamp, data: Warehouse }
   */
  toggleStatus(id: number, currentStatus: WarehouseStatus): Observable<Warehouse> {
    const nextStatus: WarehouseStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const payload: ToggleWarehouseStatusRequest = { status: nextStatus };

    return this.http
      .patch<SingleWarehouseApiResponse>(`${this.warehousesUrl}/${id}/status`, payload)
      .pipe(
        map(res => {
          if (!res.success) {
            throw { message: res.message || 'Failed to update warehouse status.' };
          }
          return res.data;
        }),
        catchError(this._handleError)
      );
  }

  /**
   * PUT/PATCH /api/warehouse/{id}/manager
   * Request body: { managerId: number }
   * Response: { success, message, timestamp, data: Warehouse }
   */
  assignManager(warehouseId: number, managerId: number): Observable<Warehouse> {
    const payload: AssignWarehouseManagerRequest = { managerId };
    return this.http
      .put<SingleWarehouseApiResponse>(`${this.warehouseCreateUrl}/${warehouseId}/manager`, payload)
      .pipe(
        map(res => {
          if (!res.success) {
            throw { message: res.message || 'Failed to assign warehouse manager.' };
          }
          return res.data;
        }),
        catchError(this._handleError)
      );
  }

  /**
   * DELETE/POST /api/warehouse/{id}/manager/remove
   * Response: { success, message, timestamp, data: Warehouse }
   */
  removeManager(warehouseId: number): Observable<Warehouse> {
    return this.http
      .delete<SingleWarehouseApiResponse>(`${this.warehouseCreateUrl}/${warehouseId}/manager/remove`)
      .pipe(
        map(res => {
          if (!res.success) {
            throw { message: res.message || 'Failed to remove warehouse manager.' };
          }
          return res.data;
        }),
        catchError(this._handleError)
      );
  }

  private _handleError(err: HttpErrorResponse | { message: string }) {
    if (err instanceof HttpErrorResponse) {
      const msg =
        err.error?.message ||
        (err.status === 409 ? 'Warehouse conflict.' :
          err.status === 400 ? 'Invalid request parameters.' :
            err.status === 403 ? 'You do not have permission to perform this action.' :
              err.status === 0 ? 'Cannot connect to server. Please try again.' :
                'An unexpected error occurred.');
      return throwError(() => ({ message: msg }));
    }
    return throwError(() => err);
  }
}
