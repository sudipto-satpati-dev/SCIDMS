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
