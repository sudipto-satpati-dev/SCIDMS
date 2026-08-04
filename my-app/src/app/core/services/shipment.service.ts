import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import {
  Shipment, CreateShipmentRequest, UpdateShipmentStatusRequest,
  ShipmentListParams, ShipmentListApiResponse, ShipmentListResult,
  SingleShipmentApiResponse, ShipmentHistoryItem, ShipmentHistoryApiResponse
} from '../models/index';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ShipmentService {
  private readonly shipmentsUrl = `${environment.apiBaseUrl}/api/shipments`;
  private readonly createShipmentUrl = `${environment.apiBaseUrl}/api/shipment`;

  constructor(private http: HttpClient) {}

  /**
   * GET /api/shipments
   * Query Params: search, status, page, size, sort
   */
  getShipments(params: ShipmentListParams = {}): Observable<ShipmentListResult> {
    let httpParams = new HttpParams();
    if (params.search) httpParams = httpParams.set('search', params.search);
    if (params.status) httpParams = httpParams.set('status', params.status);
    if (params.createdBy != null && params.createdBy !== '') {
      httpParams = httpParams.set('createdBy', params.createdBy);
    }
    if (params.page != null) httpParams = httpParams.set('page', params.page.toString());
    if (params.size != null) httpParams = httpParams.set('size', params.size.toString());
    if (params.sort) httpParams = httpParams.set('sort', params.sort);

    return this.http
      .get<ShipmentListApiResponse>(this.shipmentsUrl, { params: httpParams })
      .pipe(
        map(res => {
          if (!res.success) {
            throw { message: res.message || 'Failed to fetch shipments.' };
          }
          const d = res.data;
          return {
            shipments: d.shipments || [],
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
   * POST /api/shipment (or /api/shipments)
   * Body: { orderId, carrierName, trackingNumber, expectedDeliveryDate }
   */
  createShipmentApi(req: CreateShipmentRequest): Observable<Shipment> {
    return this.http
      .post<SingleShipmentApiResponse>(this.createShipmentUrl, req)
      .pipe(
        map(res => {
          if (!res.success) {
            throw { message: res.message || 'Failed to create shipment.' };
          }
          return res.data;
        }),
        catchError((err) => {
          // Fallback to /api/shipments if /api/shipment returns 404
          return this.http.post<SingleShipmentApiResponse>(this.shipmentsUrl, req).pipe(
            map(res => {
              if (!res.success) throw { message: res.message || 'Failed to create shipment.' };
              return res.data;
            }),
            catchError(this._handleError)
          );
        })
      );
  }

  /**
   * GET /api/shipments/{id}
   */
  getById(id: string | number): Observable<Shipment> {
    return this.http
      .get<SingleShipmentApiResponse>(`${this.shipmentsUrl}/${id}`)
      .pipe(
        map(res => {
          if (!res.success) {
            throw { message: res.message || 'Shipment not found.' };
          }
          return res.data;
        }),
        catchError(this._handleError)
      );
  }

  /**
   * PUT /api/shipments/{id}/status
   * Body: { status, remark }
   */
  updateShipmentStatus(id: string | number, status: string, remark?: string): Observable<Shipment> {
    const body: UpdateShipmentStatusRequest = {
      status,
      remark: remark || '',
      remarks: remark || ''
    };
    return this.http
      .put<SingleShipmentApiResponse>(`${this.shipmentsUrl}/${id}/status`, body)
      .pipe(
        map(res => {
          if (!res.success) {
            throw { message: res.message || `Failed to update shipment status to ${status}.` };
          }
          return res.data;
        }),
        catchError(this._handleError)
      );
  }

  /**
   * POST /api/shipments/{id}/verify-otp
   * Body: { otp: string }
   */
  verifyOtp(id: string | number, otp: string): Observable<Shipment> {
    return this.http
      .post<SingleShipmentApiResponse>(`${this.shipmentsUrl}/${id}/verify-otp`, { otp })
      .pipe(
        map(res => {
          if (!res.success) {
            throw { message: res.message || 'Invalid OTP code.' };
          }
          return res.data;
        }),
        catchError(this._handleError)
      );
  }

  /**
   * GET /api/shipments/{id}/history
   */
  getShipmentHistory(id: string | number): Observable<ShipmentHistoryItem[]> {
    return this.http
      .get<ShipmentHistoryApiResponse>(`${this.shipmentsUrl}/${id}/history`)
      .pipe(
        map(res => {
          if (!res.success) {
            throw { message: res.message || 'Failed to fetch shipment history.' };
          }
          return res.data || [];
        }),
        catchError(this._handleError)
      );
  }

  /** Backward compatibility helper methods */
  getAll(params: ShipmentListParams = {}): Observable<Shipment[]> {
    return this.getShipments({ size: 100, ...params }).pipe(
      map(res => res.shipments)
    );
  }

  createFromOrder(orderId: string | number, carrierName = 'FedEx', trackingNumber = 'TRK-AUTO', expectedDeliveryDate = ''): Observable<Shipment> {
    const targetDate = expectedDeliveryDate || new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0];
    return this.createShipmentApi({ orderId, carrierName, trackingNumber, expectedDeliveryDate: targetDate });
  }

  updateStatus(id: string | number, status: string, notes?: string): Observable<Shipment> {
    return this.updateShipmentStatus(id, status, notes);
  }

  reportFailure(id: string | number, reason: string, nextAction: string): Observable<Shipment> {
    return this.updateShipmentStatus(id, 'CANCELLED', `Delivery failed: ${reason} (Next Action: ${nextAction})`);
  }

  private _handleError(err: HttpErrorResponse | { message: string }) {
    if (err instanceof HttpErrorResponse) {
      const msg =
        err.error?.message ||
        (err.status === 404 ? 'Requested shipment or history not found.' :
          err.status === 409 ? 'Shipment request conflict.' :
            err.status === 400 ? 'Invalid shipment request parameters.' :
              err.status === 403 ? 'You do not have permission to perform this action.' :
                err.status === 0 ? 'Cannot connect to server. Please try again.' :
                  'An unexpected error occurred.');
      return throwError(() => ({ message: msg }));
    }
    return throwError(() => err);
  }
}
