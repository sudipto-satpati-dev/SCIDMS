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

export interface ApiInventoryItem {
  inventoryId: number;
  productId: number;
  productName: string;
  warehouseId: number;
  warehouseName: string;
  onHandQuantity: number;
  allocatedQuantity: number;
  availableQuantity: number;
  lowStockThreshold: number;
  lowStock: boolean;
  outOfStock: boolean;
  updatedAt?: string;
}

export interface InventoryListParams {
  productId?: number | string;
  warehouseId?: number | string;
  search?: string;
  page?: number;
  size?: number;
  sort?: string;
}

export interface InventoryListApiResponse {
  success: boolean;
  message: string;
  timestamp: string;
  data: {
    products: ApiInventoryItem[];
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
  };
}

export interface InventoryListResult {
  products: ApiInventoryItem[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
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

export interface ApiReceiveStockRequest {
  productId: number | string;
  warehouseId: number | string;
  quantity: number;
  referenceNumber: string;
}

export interface ReceiveStockData {
  referenceNumber: string;
  transactionType: string;
  productId: number | string;
  productName: string;
  sourceWarehouseId?: number | string;
  destinationWarehouseId?: number | string;
  quantity: number;
  sourceAvailableQuantity?: number;
  destinationAvailableQuantity?: number;
}

export interface ReceiveStockApiResponse {
  success: boolean;
  message: string;
  timestamp: string;
  data: ReceiveStockData;
}

export type ApiDispatchStockRequest = ApiReceiveStockRequest;
export type DispatchStockData = ReceiveStockData;
export type DispatchStockApiResponse = ReceiveStockApiResponse;
