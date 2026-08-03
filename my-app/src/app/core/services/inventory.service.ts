import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { MockApiService } from './mock-api.service';
import {
  InventoryRow, InventoryTransaction,
  StockReceiveRequest, StockDispatchRequest, StockTransferRequest,
  InventoryListParams, InventoryListApiResponse, InventoryListResult, ApiInventoryItem
} from '../models/index';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class InventoryService {
  private readonly inventoryUrl = `${environment.apiBaseUrl}/api/inventory`;

  constructor(
    private http: HttpClient,
    private api: MockApiService
  ) {}

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


