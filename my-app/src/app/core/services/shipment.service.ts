import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { MockApiService } from './mock-api.service';
import { Shipment } from '../models/index';

@Injectable({ providedIn: 'root' })
export class ShipmentService {
  constructor(private api: MockApiService) {}

  getAll(): Observable<Shipment[]>                                                       { return this.api.getShipments(); }
  getById(id: string): Observable<Shipment>                                              { return this.api.getShipmentById(id); }
  createFromOrder(orderId: string): Observable<Shipment>                                 { return this.api.createShipment(orderId); }
  updateStatus(id: string, status: Shipment['status'], notes?: string): Observable<Shipment> { return this.api.updateShipmentStatus(id, status, notes); }
  reportFailure(id: string, reason: string, nextAction: string): Observable<Shipment>   { return this.api.reportDeliveryFailure(id, reason, nextAction); }
}
