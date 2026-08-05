export interface ApiAuditLog {
  id: number;
  userId: number;
  username: string;
  action: string;
  module: string;
  entityType: string;
  entityId: number;
  description: string;
  timestamp: string;
}

export interface AuditLogListParams {
  search?: string;
  action?: string;
  module?: string;
  entityType?: string;
  entityId?: number;
  page?: number;
  size?: number;
  sort?: string;
}

export interface AuditLogListResult {
  auditlogs: ApiAuditLog[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface AuditLogListApiResponse {
  success: boolean;
  message: string;
  timestamp?: string;
  data: {
    auditlogs: ApiAuditLog[];
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
  };
}

export interface CreateAuditLogRequest {
  action: string;
  module: string;
  entityType: string;
  entityId: number;
  description: string;
}

export interface CreateAuditLogApiResponse {
  success: boolean;
  message: string;
  timestamp?: string;
  data: ApiAuditLog;
}

/** Backward compatibility interface */
export type AuditLog = ApiAuditLog;

export const AUDIT_ACTIONS = [
  'USER_REGISTERED',
  'LOGIN_SUCCESS',
  'LOGIN_FAILED',
  'USER_CREATED',
  'USER_UPDATED',
  'USER_STATUS_CHANGED',
  'PRODUCT_CREATED',
  'PRODUCT_UPDATED',
  'PRODUCT_STATUS_CHANGED',
  'WAREHOUSE_STATUS_CHANGED',
  'STOCK_RECEIVED',
  'STOCK_ALLOCATED',
  'STOCK_DISPATCHED',
  'STOCK_TRANSFERRED',
  'ORDER_CREATED',
  'ORDER_APPROVED',
  'ORDER_STATUS_CHANGED',
  'SHIPMENT_CREATED',
  'SHIPMENT_STATUS_CHANGED',
  'REPORT_EXPORTED'
];

export const AUDIT_MODULES = [
  'AUTHENTICATION',
  'USER_MANAGEMENT',
  'PRODUCT_MANAGEMENT',
  'WAREHOUSE_MANAGEMENT',
  'INVENTORY_MANAGEMENT',
  'ORDER_MANAGEMENT',
  'SHIPMENT_MANAGEMENT',
  'REPORTING'
];
