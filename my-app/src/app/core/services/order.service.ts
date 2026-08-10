import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import {
  Order, CreateOrderRequest,
  OrderListParams, OrderListApiResponse, OrderListResult, SingleOrderApiResponse,
  OrderHistoryItem, OrderHistoryApiResponse
} from '../models/index';
import { environment } from '../../../environments/environment';

import { AuditService } from './audit.service';

@Injectable({ providedIn: 'root' })
export class OrderService {
  private readonly ordersUrl = `${environment.apiBaseUrl}/api/orders`;

  constructor(
    private http: HttpClient,
    private auditService: AuditService
  ) {}

  /**
   * GET /api/orders
   * Query Params: search, status, warehouseId, page, size, sort
   */
  getOrders(params: OrderListParams = {}): Observable<OrderListResult> {
    let httpParams = new HttpParams();
    if (params.search) httpParams = httpParams.set('search', params.search);
    if (params.status) httpParams = httpParams.set('status', params.status);
    if (params.warehouseId != null && params.warehouseId !== '') {
      httpParams = httpParams.set('warehouseId', params.warehouseId.toString());
    }
    if (params.warehouseIds && params.warehouseIds.length > 0) {
      const idsStr = params.warehouseIds.filter(id => id != null && id !== '').join(',');
      if (idsStr) {
        httpParams = httpParams.set('warehouseIds', idsStr);
      }
    }
    if (params.createdBy != null && params.createdBy !== '') {
      httpParams = httpParams.set('createdBy', params.createdBy);
    }
    if (params.page != null) httpParams = httpParams.set('page', params.page.toString());
    if (params.size != null) httpParams = httpParams.set('size', params.size.toString());
    if (params.sort) httpParams = httpParams.set('sort', params.sort);

    return this.http
      .get<OrderListApiResponse>(this.ordersUrl, { params: httpParams })
      .pipe(
        map(res => {
          if (!res.success) {
            throw { message: res.message || 'Failed to fetch orders.' };
          }
          const d = res.data;
          return {
            orders: d.orders || [],
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
   * POST /api/orders
   * Body: { customerName, customerEmail, deliveryAddress, warehouseId, items: [{ productId, quantity }] }
   */
  createOrderApi(req: CreateOrderRequest): Observable<Order> {
    return this.http
      .post<SingleOrderApiResponse>(this.ordersUrl, req)
      .pipe(
        map(res => {
          if (!res.success) {
            throw { message: res.message || 'Failed to create order.' };
          }
          const o = res.data;

          // Record Audit Log for Order Creation
          const orderIdNum = typeof o.id === 'number' ? o.id : Number(o.id) || 0;
          this.auditService.createAuditLog({
            action: 'ORDER_CREATED',
            module: 'ORDER_MANAGEMENT',
            entityType: 'ORDER',
            entityId: orderIdNum,
            description: `Created customer order '${o.orderNumber || o.id}' for ${o.customerName} (${o.customerEmail})`
          }).subscribe({
            next: () => {},
            error: (e) => console.warn('Audit log trigger failed for order creation:', e)
          });

          return o;
        }),
        catchError(this._handleError)
      );
  }

  /**
   * GET /api/orders/{id}
   */
  getById(id: string | number): Observable<Order> {
    return this.http
      .get<SingleOrderApiResponse>(`${this.ordersUrl}/${id}`)
      .pipe(
        map(res => {
          if (!res.success) {
            throw { message: res.message || 'Order not found.' };
          }
          return res.data;
        }),
        catchError(this._handleError)
      );
  }

  /**
   * GET /api/orders/{id}/history
   */
  getOrderHistory(id: string | number): Observable<OrderHistoryItem[]> {
    return this.http
      .get<OrderHistoryApiResponse>(`${this.ordersUrl}/${id}/history`)
      .pipe(
        map(res => {
          if (!res.success) {
            throw { message: res.message || 'Failed to fetch order history.' };
          }
          return res.data || [];
        }),
        catchError(this._handleError)
      );
  }

  /**
   * POST /api/orders/{id}/approve
   */
  approveOrder(id: string | number): Observable<Order> {
    return this.http
      .post<SingleOrderApiResponse>(`${this.ordersUrl}/${id}/approve`, {})
      .pipe(
        map(res => {
          if (!res.success) {
            throw { message: res.message || 'Failed to approve order.' };
          }
          const o = res.data;

          // Record Audit Log for Order Approval
          const orderIdNum = typeof o.id === 'number' ? o.id : Number(o.id) || 0;
          this.auditService.createAuditLog({
            action: 'ORDER_APPROVED',
            module: 'ORDER_MANAGEMENT',
            entityType: 'ORDER',
            entityId: orderIdNum,
            description: `Approved order '${o.orderNumber || o.id}'`
          }).subscribe({
            next: () => {},
            error: (e) => console.warn('Audit log trigger failed for order approval:', e)
          });

          return o;
        }),
        catchError(this._handleError)
      );
  }

  /**
   * PUT /api/orders/{id}/status
   * Body: { status, remarks }
   */
  updateOrderStatus(id: string | number, status: string, remarks?: string): Observable<Order> {
    const body = { status, remarks: remarks || '', remark: remarks || '' };
    return this.http
      .put<SingleOrderApiResponse>(`${this.ordersUrl}/${id}/status`, body)
      .pipe(
        map(res => {
          if (!res.success) {
            throw { message: res.message || `Failed to update order status to ${status}.` };
          }
          const o = res.data;

          // Record Audit Log for Order Status Update
          const orderIdNum = typeof o.id === 'number' ? o.id : Number(o.id) || 0;
          this.auditService.createAuditLog({
            action: 'ORDER_STATUS_CHANGED',
            module: 'ORDER_MANAGEMENT',
            entityType: 'ORDER',
            entityId: orderIdNum,
            description: `Updated status for order '${o.orderNumber || o.id}' to '${status}'${remarks ? ` (${remarks})` : ''}`
          }).subscribe({
            next: () => {},
            error: (e) => console.warn('Audit log trigger failed for order status change:', e)
          });

          return o;
        }),
        catchError(this._handleError)
      );
  }

  /** Backward compatibility aliases */
  approve(id: string | number): Observable<Order> {
    return this.approveOrder(id);
  }

  reject(id: string | number, reason: string): Observable<Order> {
    return this.updateOrderStatus(id, 'CANCELLED', reason);
  }

  cancel(id: string | number): Observable<Order> {
    return this.updateOrderStatus(id, 'CANCELLED', 'Order cancelled by user');
  }

  /** Helper method returning all orders array */
  getAll(params: OrderListParams = {}): Observable<Order[]> {
    return this.getOrders({ size: 100, ...params }).pipe(
      map(res => res.orders)
    );
  }

  private _handleError(err: HttpErrorResponse | { message: string }) {
    if (err instanceof HttpErrorResponse) {
      const msg =
        err.error?.message ||
        (err.status === 404 ? 'Requested order or history not found.' :
          err.status === 409 ? 'Order request conflict.' :
            err.status === 400 ? 'Invalid order parameters.' :
              err.status === 403 ? 'You do not have permission to perform this action.' :
                err.status === 0 ? 'Cannot connect to server. Please try again.' :
                  'An unexpected error occurred.');
      return throwError(() => ({ message: msg }));
    }
    return throwError(() => err);
  }
}


