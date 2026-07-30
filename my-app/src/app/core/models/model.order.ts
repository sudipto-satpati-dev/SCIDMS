export type OrderStatus =
  | 'Created'
  | 'Approved'
  | 'Packed'
  | 'Dispatched'
  | 'Delivered'
  | 'Rejected'
  | 'Cancelled';

export interface OrderItem {
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
}

export interface OrderStatusEvent {
  status: OrderStatus;
  changedBy: string;
  timestamp: string;
  notes: string;
}

export interface Order {
  id: string;
  customerName: string;
  contactNumber: string;
  address: string;
  orderDate: string;
  status: OrderStatus;
  priority: 'High' | 'Medium' | 'Low';
  approvedBy: string;
  approvedDate: string;
  submittedBy: string;
  items: OrderItem[];
  history: OrderStatusEvent[];
  rejectionReason?: string;
}

export interface CreateOrderRequest {
  customerName: string;
  contactNumber: string;
  address: string;
  items: { productId: string; quantity: number }[];
}
