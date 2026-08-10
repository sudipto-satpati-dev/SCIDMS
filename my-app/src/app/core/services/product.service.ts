import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import {
  Product,
  ProductStatus,
  CreateProductRequest,
  UpdateProductRequest,
  ToggleProductStatusRequest,
  SingleProductApiResponse,
  ProductListParams,
  ProductListApiResponse,
  ProductListResult,
} from '../models/index';
import { environment } from '../../../environments/environment';

import { AuditService } from './audit.service';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly productsUrl = `${environment.apiBaseUrl}/api/products`;

  constructor(
    private http: HttpClient,
    private auditService: AuditService
  ) {}

  /**
   * GET /api/products
   * Query params: search, categoryId, status, page, size, sort
   */
  getAll(params: ProductListParams = {}): Observable<ProductListResult> {
    let httpParams = new HttpParams();
    if (params.search) httpParams = httpParams.set('search', params.search);
    if (params.categoryId != null) httpParams = httpParams.set('categoryId', params.categoryId.toString());
    if (params.status) httpParams = httpParams.set('status', params.status);
    if (params.sort) httpParams = httpParams.set('sort', params.sort);
    if (params.page != null) httpParams = httpParams.set('page', params.page.toString());
    if (params.size != null) httpParams = httpParams.set('size', params.size.toString());

    return this.http
      .get<ProductListApiResponse>(this.productsUrl, { params: httpParams })
      .pipe(
        map(res => {
          if (!res.success) {
            throw { message: res.message || 'Failed to fetch products.' };
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

  /**
   * POST /api/products
   * Request body: { name, categoryId, unitPrice }
   * Response: { success, message, timestamp, data: Product }
   */
  create(data: CreateProductRequest): Observable<Product> {
    return this.http
      .post<SingleProductApiResponse>(this.productsUrl, data)
      .pipe(
        map(res => {
          if (!res.success) {
            throw { message: res.message || 'Failed to create product.' };
          }
          const p = res.data;

          // Record Audit Log for Product Creation
          this.auditService.createAuditLog({
            action: 'PRODUCT_CREATED',
            module: 'PRODUCT_MANAGEMENT',
            entityType: 'PRODUCT',
            entityId: p.id,
            description: `Created product '${p.name}' (SKU: ${p.sku || 'N/A'}, Price: $${p.unitPrice})`
          }).subscribe({
            next: () => {},
            error: (e) => console.warn('Audit log trigger failed for product creation:', e)
          });

          return p;
        }),
        catchError(this._handleError)
      );
  }

  /**
   * PUT /api/products/{id}
   * Request body: { name, categoryId, unitPrice }
   * Response: { success, message, timestamp, data: Product }
   */
  update(id: number, data: UpdateProductRequest): Observable<Product> {
    return this.http
      .put<SingleProductApiResponse>(`${this.productsUrl}/${id}`, data)
      .pipe(
        map(res => {
          if (!res.success) {
            throw { message: res.message || 'Failed to update product.' };
          }
          const p = res.data;

          // Record Audit Log for Product Update
          this.auditService.createAuditLog({
            action: 'PRODUCT_UPDATED',
            module: 'PRODUCT_MANAGEMENT',
            entityType: 'PRODUCT',
            entityId: p.id,
            description: `Updated product '${p.name}' (ID #${p.id})`
          }).subscribe({
            next: () => {},
            error: (e) => console.warn('Audit log trigger failed for product update:', e)
          });

          return p;
        }),
        catchError(this._handleError)
      );
  }

  /**
   * PATCH /api/products/{id}/status
   * Request body: { status: 'ACTIVE' | 'INACTIVE' }
   * Response: { success, message, timestamp, data: Product }
   */
  toggleStatus(id: number, currentStatus: ProductStatus): Observable<Product> {
    const nextStatus: ProductStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const payload: ToggleProductStatusRequest = { status: nextStatus };

    return this.http
      .patch<SingleProductApiResponse>(`${this.productsUrl}/${id}/status`, payload)
      .pipe(
        map(res => {
          if (!res.success) {
            throw { message: res.message || 'Failed to update product status.' };
          }
          const p = res.data;

          // Record Audit Log for Product Status Toggle
          this.auditService.createAuditLog({
            action: 'PRODUCT_STATUS_CHANGED',
            module: 'PRODUCT_MANAGEMENT',
            entityType: 'PRODUCT',
            entityId: p.id,
            description: `Toggled product status for '${p.name}' to ${p.status}`
          }).subscribe({
            next: () => {},
            error: (e) => console.warn('Audit log trigger failed for product status toggle:', e)
          });

          return p;
        }),
        catchError(this._handleError)
      );
  }

  private _handleError(err: HttpErrorResponse | { message: string }) {
    if (err instanceof HttpErrorResponse) {
      const msg =
        err.error?.message ||
        (err.status === 409 ? 'Product SKU or name conflict.' :
          err.status === 400 ? 'Invalid request. Please check the form.' :
            err.status === 403 ? 'You do not have permission to perform this action.' :
              err.status === 0 ? 'Cannot connect to server. Please try again.' :
                'An unexpected error occurred.');
      return throwError(() => ({ message: msg }));
    }
    return throwError(() => err);
  }
}
