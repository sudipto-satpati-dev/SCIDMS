export type ShipmentStatus =
  | 'Created'
  | 'Ready for Dispatch'
  | 'In Transit'
  | 'Delivered'
  | 'Returned';

export interface ShipmentStatusEvent {
  status: string;
  changedBy: string;
  timestamp: string;
  notes: string;
}

export interface Shipment {
  id: string;
  orderId: string;
  customerName: string;
  customerAddress: string;
  status: ShipmentStatus;
  dispatchDate: string;
  lastUpdated: string;
  carrierName: string;
  carrierTracking: string;
  serviceLevel: string;
  vehicleId: string;
  originHub: string;
  originAddress: string;
  estimatedArrival: string;
  failureReason?: string;
  nextAction?: string;
  history: ShipmentStatusEvent[];
}