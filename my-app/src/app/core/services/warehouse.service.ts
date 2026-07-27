import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { MockApiService } from './mock-api.service';
import { Warehouse } from '../models/index';

@Injectable({ providedIn: 'root' })
export class WarehouseService {
  constructor(private api: MockApiService) {}

  getAll(): Observable<Warehouse[]>                                          { return this.api.getWarehouses(); }
  create(data: Omit<Warehouse, 'id' | 'occupiedCapacity'>): Observable<Warehouse> { return this.api.createWarehouse(data); }
  update(id: string, data: Partial<Warehouse>): Observable<Warehouse>       { return this.api.updateWarehouse(id, data); }
  toggleStatus(id: string): Observable<Warehouse>                           { return this.api.toggleWarehouseStatus(id); }
}
