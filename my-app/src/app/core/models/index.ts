/**
 * SCIDMS — Shared Domain Models
 *
 * All interfaces mirror the BRD entity definitions (Section 15.1).
 * When replacing mock APIs with real Spring Boot endpoints, only the
 * service layer (ApiService → concrete services) changes; these
 * interfaces stay identical because they reflect the backend DTOs.
 */

// ─────────────────────────────────────────────────────────────
// Auth / Users
// ─────────────────────────────────────────────────────────────
export type UserRole =
  | 'ADMIN'
  | 'WAREHOUSE MANAGER'
  | 'SALES EXECUTIVE'
  | 'DISTRIBUTION MANAGER'
  | 'MANAGER';

export interface User {
  id: number;
  username: string;
  email: string;
  role: UserRole;
  status: 'Active' | 'Inactive';
  createdAt?: string;
}

export interface AuthCredentials {
  usernameOrEmail: string;
  password: string;
}

/** POST /api/users — request body */
export interface CreateUserRequest {
  username: string;
  email:    string;
  password: string;
  role:     UserRole;
}

/** POST /api/users — response envelope */
export interface CreateUserApiResponse {
  success: boolean;
  message: string;
  data: {
    id:        number;
    email:     string;
    role:      string;
    status:    string;
    createdAt: string;
  };
}

/** Exact shape returned by POST /api/auth/login */
export interface LoginApiResponse {
  data: {
    token: string;
    tokenType: string;
    expiresIn: number;
    userId: number;
    username: string;
    email: string;
    role: string;
  };
  message: string;
  success: boolean;
  timestamp: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

// ─────────────────────────────────────────────────────────────
// Products
// ─────────────────────────────────────────────────────────────
export type ProductCategory =
  | 'Electronics'
  | 'Industrial'
  | 'Packaging'
  | 'Safety'
  | 'Tools'
  | 'Raw Materials';

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: ProductCategory;
  unitPrice: number;
  availableQty: number;
  threshold: number;
  status: 'Active' | 'Inactive';
}

// ─────────────────────────────────────────────────────────────
// Warehouses
// ─────────────────────────────────────────────────────────────
export type WarehouseRegion = 'Dhaka' | 'Chittagong' | 'Sylhet' | 'Rajshahi' | 'Khulna';

export interface Warehouse {
  id: string;
  name: string;
  location: string;
  region: WarehouseRegion;
  totalCapacity: number;
  occupiedCapacity: number;
  status: 'Active' | 'Inactive';
  photo: string; // CSS gradient string used as placeholder
}

// ─────────────────────────────────────────────────────────────
// Inventory
// ─────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────
// Orders
// ─────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────
// Shipments
// ─────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────
// Audit
// ─────────────────────────────────────────────────────────────
export type AuditAction = 'Created' | 'Updated' | 'Deleted';
export type AuditModule =
  | 'PRODUCTS'
  | 'WAREHOUSES'
  | 'SHIPMENTS'
  | 'ORDERS'
  | 'USERS'
  | 'INVENTORY';

export interface AuditLog {
  id: string;
  timestamp: string;
  actorName: string;
  actorRole: string;
  actorInitials: string;
  action: AuditAction;
  module: AuditModule;
  recordRef: string;
  oldValue: string;
  newValue: string;
  reason: string;
  ipAddress?: string;
}

// ─────────────────────────────────────────────────────────────
// Dashboard / Reports
// ─────────────────────────────────────────────────────────────
export interface DashboardStats {
  orderStatusData: { label: string; count: number; pct: number; color: string }[];
  shipmentPerfData: { label: string; pct: number; color: string }[];
  warehouseData: { name: string; used: number; occupied: number; total: number }[];
  recentOrders: {
    id: string; customer: string; items: number;
    total: string; status: string; statusClass: string; date: string;
  }[];
  lowStockItems: {
    product: string; warehouse: string; qty: number; threshold: number;
  }[];
}
