import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { MockApiService } from './mock-api.service';
import { Order, CreateOrderRequest } from '../models/index';

@Injectable({ providedIn: 'root' })
export class OrderService {
  constructor(private api: MockApiService) {}

  getAll(): Observable<Order[]>                               { return this.api.getOrders(); }
  getById(id: string): Observable<Order>                      { return this.api.getOrderById(id); }
  create(req: CreateOrderRequest): Observable<Order>          { return this.api.createOrder(req); }
  approve(id: string): Observable<Order>                      { return this.api.approveOrder(id); }
  reject(id: string, reason: string): Observable<Order>       { return this.api.rejectOrder(id, reason); }
  cancel(id: string): Observable<Order>                       { return this.api.cancelOrder(id); }
}
