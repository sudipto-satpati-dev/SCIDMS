export interface InventoryRow {
  productId: string;
  productName: string;
  sku: string;
  warehouseId: string;
  warehouseName: string;
  availableQty: number;
  allocatedQty: number;
  threshold: number;
}

export type TransactionType = 'Received' | 'Dispatched' | 'Transferred';

export interface InventoryTransaction {
  id: string;
  type: TransactionType;
  productId: string;
  productName: string;
  warehouseId: string;
  warehouseName: string;
  quantity: number;
  actor: string;
  reason: string;
  timestamp: string;
}

export interface StockReceiveRequest {
  warehouseId: string;
  productId: string;
  quantity: number;
  reason: string;
  date: string;
}

export interface StockDispatchRequest {
  warehouseId: string;
  productId: string;
  quantity: number;
  reason: string;
  date: string;
}

export interface StockTransferRequest {
  sourceWarehouseId: string;
  destinationWarehouseId: string;
  productId: string;
  quantity: number;
  reason: string;
}