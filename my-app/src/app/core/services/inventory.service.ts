import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { MockApiService } from './mock-api.service';
import {
  InventoryRow, InventoryTransaction,
  StockReceiveRequest, StockDispatchRequest, StockTransferRequest,
  InventoryListParams, InventoryListApiResponse, InventoryListResult, ApiInventoryItem, LowStockApiResponse,
  ApiReceiveStockRequest, ReceiveStockData, ReceiveStockApiResponse,
  ApiDispatchStockRequest,
  DispatchStockData,
  DispatchStockApiResponse,
  ApiTransferStockRequest, TransferStockData, TransferStockApiResponse,
  ApiInventoryTransaction, TransactionHistoryParams, TransactionHistoryApiResponse, TransactionHistoryResult
} from '../models/index';
import { environment } from '../../../environments/environment';

import { AuditService } from './audit.service';

@Injectable({ providedIn: 'root' })
export class InventoryService {
  private readonly inventoryUrl = `${environment.apiBaseUrl}/api/inventory`;
  private readonly receiveUrl   = `${environment.apiBaseUrl}/api/inventory/receive`;
  private readonly dispatchUrl  = `${environment.apiBaseUrl}/api/inventory/dispatch`;
  private readonly transferUrl  = `${environment.apiBaseUrl}/api/warehouse/transfer`;
  private readonly historyUrl   = `${environment.apiBaseUrl}/api/inventory/history`;

  constructor(
    private http: HttpClient,
    private api: MockApiService,
    private auditService: AuditService
  ) {}

  /**
   * POST /api/inventory/receive
   * Body: { productId, warehouseId, quantity, referenceNumber }
   */
  receiveStockApi(req: ApiReceiveStockRequest): Observable<ReceiveStockData> {
    return this.http
      .post<ReceiveStockApiResponse>(this.receiveUrl, req)
      .pipe(
        map(res => {
          if (!res.success) {
            throw { message: res.message || 'Failed to receive stock.' };
          }
          const d = res.data;

          // Record Audit Log for Stock Receive
          const prodIdNum = typeof d.productId === 'number' ? d.productId : Number(d.productId) || 0;
          this.auditService.createAuditLog({
            action: 'STOCK_RECEIVED',
            module: 'INVENTORY_MANAGEMENT',
            entityType: 'INVENTORY',
            entityId: prodIdNum,
            description: `Received ${req.quantity} units of Product #${req.productId} into Warehouse #${req.warehouseId} (Ref: ${req.referenceNumber})`
          }).subscribe({
            next: () => {},
            error: (e) => console.warn('Audit log trigger failed for stock receive:', e)
          });

          return d;
        }),
        catchError(this._handleError)
      );
  }

  /**
   * POST /api/inventory/dispatch
   * Body: { productId, warehouseId, quantity, referenceNumber }
   */
  dispatchStockApi(req: ApiDispatchStockRequest): Observable<DispatchStockData> {
    return this.http
      .post<DispatchStockApiResponse>(this.dispatchUrl, req)
      .pipe(
        map(res => {
          if (!res.success) {
            throw { message: res.message || 'Failed to dispatch stock.' };
          }
          const d = res.data;

          // Record Audit Log for Stock Dispatch
          const prodIdNum = typeof d.productId === 'number' ? d.productId : Number(d.productId) || 0;
          this.auditService.createAuditLog({
            action: 'STOCK_DISPATCHED',
            module: 'INVENTORY_MANAGEMENT',
            entityType: 'INVENTORY',
            entityId: prodIdNum,
            description: `Dispatched ${req.quantity} units of Product #${req.productId} from Warehouse #${req.warehouseId} (Ref: ${req.referenceNumber})`
          }).subscribe({
            next: () => {},
            error: (e) => console.warn('Audit log trigger failed for stock dispatch:', e)
          });

          return d;
        }),
        catchError(this._handleError)
      );
  }

  /**
   * POST /api/warehouse/transfer
   * Body: { productId, sourceWarehouseId, destinationWarehouseId, quantity, referenceNumber }
   */
  transferStockApi(req: ApiTransferStockRequest): Observable<TransferStockData> {
    return this.http
      .post<TransferStockApiResponse>(this.transferUrl, req)
      .pipe(
        map(res => {
          if (!res.success) {
            throw { message: res.message || 'Failed to transfer stock.' };
          }
          const d = res.data;

          // Record Audit Log for Stock Transfer
          const prodIdNum = typeof d.productId === 'number' ? d.productId : Number(d.productId) || 0;
          this.auditService.createAuditLog({
            action: 'STOCK_TRANSFERRED',
            module: 'INVENTORY_MANAGEMENT',
            entityType: 'INVENTORY',
            entityId: prodIdNum,
            description: `Transferred ${req.quantity} units of Product #${req.productId} from Warehouse #${req.sourceWarehouseId} to Warehouse #${req.destinationWarehouseId} (Ref: ${req.referenceNumber})`
          }).subscribe({
            next: () => {},
            error: (e) => console.warn('Audit log trigger failed for stock transfer:', e)
          });

          return d;
        }),
        catchError(this._handleError)
      );
  }

  /**
   * GET /api/inventory/history
   * Query Params: productId, warehouseId, transactionType, page, size, sort
   */
  getTransactionHistory(params: TransactionHistoryParams = {}): Observable<TransactionHistoryResult> {
    let httpParams = new HttpParams();
    if (params.productId != null && params.productId !== '') {
      httpParams = httpParams.set('productId', params.productId.toString());
    }
    if (params.warehouseId != null && params.warehouseId !== '') {
      httpParams = httpParams.set('warehouseId', params.warehouseId.toString());
    }
    if (params.transactionType != null && params.transactionType !== '') {
      httpParams = httpParams.set('transactionType', params.transactionType);
    }
    if (params.page != null) httpParams = httpParams.set('page', params.page.toString());
    if (params.size != null) httpParams = httpParams.set('size', params.size.toString());
    if (params.sort) httpParams = httpParams.set('sort', params.sort);

    return this.http
      .get<TransactionHistoryApiResponse>(this.historyUrl, { params: httpParams })
      .pipe(
        map(res => {
          if (!res.success) {
            throw { message: res.message || 'Failed to fetch transaction history.' };
          }
          const d = res.data;
          return {
            transactions: d.transactions || [],
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
   * GET /api/inventory
   * Query Params: productId, warehouseId, search, page, size, sort
   */
  getInventory(params: InventoryListParams = {}): Observable<InventoryListResult> {
    let httpParams = new HttpParams();
    if (params.productId != null && params.productId !== '') {
      httpParams = httpParams.set('productId', params.productId.toString());
    }
    if (params.warehouseId != null && params.warehouseId !== '') {
      httpParams = httpParams.set('warehouseId', params.warehouseId.toString());
    }
    if (params.search) httpParams = httpParams.set('search', params.search);
    if (params.page != null) httpParams = httpParams.set('page', params.page.toString());
    if (params.size != null) httpParams = httpParams.set('size', params.size.toString());
    if (params.sort) httpParams = httpParams.set('sort', params.sort);

    return this.http
      .get<InventoryListApiResponse>(this.inventoryUrl, { params: httpParams })
      .pipe(
        map(res => {
          if (!res.success) {
            throw { message: res.message || 'Failed to fetch inventory.' };
          }
          const d = res.data;
          return {
            products: d.products || [],
            page: d.page ?? 0,
            size: d.size ?? 0,
            totalElements: d.totalElements ?? 0,
            totalPages: d.totalPages ?? 0,
          };
        }),
        catchError(this._handleError)
      );
  }

  getAll(): Observable<InventoryRow[]>                                  { return this.api.getInventory(); }
  getByWarehouse(id: string): Observable<InventoryRow[]>               { return this.api.getInventoryByWarehouse(id); }
  getLowStock(): Observable<InventoryRow[]>                             { return this.api.getLowStockItems(); }

  /**
   * GET /api/inventory/lowstock
   */
  getLowStockItemsApi(params: InventoryListParams = {}): Observable<InventoryListResult> {
    const lowStockUrl = `${environment.apiBaseUrl}/api/inventory/lowstock`;
    let httpParams = new HttpParams();
    if (params.productId != null && params.productId !== '') {
      httpParams = httpParams.set('productId', params.productId.toString());
    }
    if (params.warehouseId != null && params.warehouseId !== '') {
      httpParams = httpParams.set('warehouseId', params.warehouseId.toString());
    }
    if (params.search) httpParams = httpParams.set('search', params.search);
    if (params.page != null) httpParams = httpParams.set('page', params.page.toString());
    if (params.size != null) httpParams = httpParams.set('size', params.size.toString());
    if (params.sort) httpParams = httpParams.set('sort', params.sort);

    return this.http
      .get<LowStockApiResponse>(lowStockUrl, { params: httpParams })
      .pipe(
        map(res => {
          if (!res.success) {
            throw { message: res.message || 'Failed to fetch low stock inventory.' };
          }
          const d = res.data;
          return {
            products: d.items || [],
            page: d.page ?? 0,
            size: d.size ?? 0,
            totalElements: d.totalElements ?? 0,
            totalPages: d.totalPages ?? 0,
          };
        }),
        catchError(this._handleError)
      );
  }
  getTransactions(): Observable<InventoryTransaction[]>                 { return this.api.getTransactions(); }
  receiveStock(req: StockReceiveRequest): Observable<InventoryTransaction>  { return this.api.receiveStock(req); }
  dispatchStock(req: StockDispatchRequest): Observable<InventoryTransaction> { return this.api.dispatchStock(req); }
  transferStock(req: StockTransferRequest): Observable<InventoryTransaction> { return this.api.transferStock(req); }

  private _handleError(err: HttpErrorResponse | { message: string }) {
    if (err instanceof HttpErrorResponse) {
      const msg =
        err.error?.message ||
        (err.status === 409 ? 'Inventory request conflict.' :
          err.status === 400 ? 'Invalid request parameters.' :
            err.status === 403 ? 'You do not have permission to perform this action.' :
              err.status === 0 ? 'Cannot connect to server. Please try again.' :
                'An unexpected error occurred.');
      return throwError(() => ({ message: msg }));
    }
    return throwError(() => err);
  }
}


