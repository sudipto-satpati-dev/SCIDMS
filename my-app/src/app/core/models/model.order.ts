export type OrderStatus =
  | 'CREATED'
  | 'APPROVED'
  | 'PACKED'
  | 'DISPATCHED'
  | 'DELIVERED'
  | 'CANCELLED'

export interface OrderItem {
  itemId: number | string;
  productId: number | string;
  productName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface Order {
  id: number | string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  deliveryAddress: string;
  warehouseId: number | string;
  warehouseName: string;
  status: OrderStatus | string;
  totalAmount: number;
  createdBy: string;
  approvedBy?: string;
  items: OrderItem[];
  createdAt: string;
  updatedAt?: string;
  // Fallbacks for UI compatibility
  contactNumber?: string;
  address?: string;
  orderDate?: string;
  history?: OrderHistoryItem[];
}

export interface CreateOrderRequest {
  customerName: string;
  customerEmail: string;
  deliveryAddress: string;
  warehouseId: number | string;
  items: {
    productId: number | string;
    quantity: number;
  }[];
}

export interface OrderListParams {
  search?: string;
  status?: string;
  warehouseId?: number | string;
  page?: number;
  size?: number;
  sort?: string;
}

export interface OrderListApiResponse {
  success: boolean;
  message: string;
  timestamp: string;
  data: {
    orders: Order[];
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
  };
}

export interface OrderListResult {
  orders: Order[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface SingleOrderApiResponse {
  success: boolean;
  message: string;
  timestamp: string;
  data: Order;
}

export interface OrderHistoryItem {
  historyId: number | string;
  previousStatus: string;
  newStatus: string;
  changedBy: string;
  remarks: string;
  changedAt: string;
}

export interface OrderHistoryApiResponse {
  success: boolean;
  message: string;
  timestamp: string;
  data: OrderHistoryItem[];
}

export interface UpdateOrderStatusRequest {
  status: string;
  remarks?: string;
}



