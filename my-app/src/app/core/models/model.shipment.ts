export type ShipmentStatus =
  | 'CREATED'
  | 'IN_TRANSIT'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'Created'
  | 'Ready for Dispatch'
  | 'In Transit'
  | 'Delivered'
  | 'Returned';

export interface Shipment {
  id: number | string;
  shipmentNumber: string;
  orderId: number | string;
  orderNumber?: string;
  orderStatus?: string;
  customerName: string;
  deliveryAddress: string;
  carrierName: string;
  trackingNumber: string;
  expectedDeliveryDate: string;
  actualDeliveryDate?: string;
  status: ShipmentStatus | string;
  createdAt: string;
  updatedAt?: string;
  createdBy: string;
  // UI Compatibility Fallbacks
  customerAddress?: string;
  carrierTracking?: string;
  dispatchDate?: string;
  estimatedArrival?: string;
  history?: ShipmentHistoryItem[] | any[];
}

export interface CreateShipmentRequest {
  orderId: number | string;
  carrierName: string;
  trackingNumber: string;
  expectedDeliveryDate: string;
}

export interface UpdateShipmentStatusRequest {
  status: string;
  remark?: string;
  remarks?: string;
}

export interface ShipmentListParams {
  search?: string;
  status?: string;
  createdBy?: string;
  page?: number;
  size?: number;
  sort?: string;
}

export interface ShipmentListApiResponse {
  success: boolean;
  message: string;
  timestamp: string;
  data: {
    shipments: Shipment[];
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
  };
}

export interface ShipmentListResult {
  shipments: Shipment[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface SingleShipmentApiResponse {
  success: boolean;
  message: string;
  timestamp: string;
  data: Shipment;
}

export interface ShipmentHistoryItem {
  historyId: number | string;
  previousStatus: string;
  newStatus: string;
  changedBy: string;
  remarks: string;
  changedAt: string;
}

export interface ShipmentHistoryApiResponse {
  success: boolean;
  message: string;
  timestamp: string;
  data: ShipmentHistoryItem[];
}