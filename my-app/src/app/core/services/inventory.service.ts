import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { MockApiService } from './mock-api.service';
import {
  InventoryRow, InventoryTransaction,
  StockReceiveRequest, StockDispatchRequest, StockTransferRequest
} from '../models/index';

@Injectable({ providedIn: 'root' })
export class InventoryService {
  constructor(private api: MockApiService) {}

  getAll(): Observable<InventoryRow[]>                                  { return this.api.getInventory(); }
  getByWarehouse(id: string): Observable<InventoryRow[]>               { return this.api.getInventoryByWarehouse(id); }
  getLowStock(): Observable<InventoryRow[]>                             { return this.api.getLowStockItems(); }
  getTransactions(): Observable<InventoryTransaction[]>                 { return this.api.getTransactions(); }
  receiveStock(req: StockReceiveRequest): Observable<InventoryTransaction>  { return this.api.receiveStock(req); }
  dispatchStock(req: StockDispatchRequest): Observable<InventoryTransaction> { return this.api.dispatchStock(req); }
  transferStock(req: StockTransferRequest): Observable<InventoryTransaction> { return this.api.transferStock(req); }
}
