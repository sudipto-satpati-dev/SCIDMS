import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { MockApiService } from './mock-api.service';
import { Product } from '../models/index';

/**
 * ProductService — thin wrapper around MockApiService.
 * When migrating to a real backend, replace MockApiService calls with
 * HttpClient calls to /api/products. The component layer stays the same.
 */
@Injectable({ providedIn: 'root' })
export class ProductService {
  constructor(private api: MockApiService) {}

  getAll(): Observable<Product[]>                           { return this.api.getProducts(); }
  create(data: Omit<Product, 'id'>): Observable<Product>   { return this.api.createProduct(data); }
  update(id: string, data: Partial<Product>): Observable<Product> { return this.api.updateProduct(id, data); }
  toggleStatus(id: string): Observable<Product>            { return this.api.toggleProductStatus(id); }
}
