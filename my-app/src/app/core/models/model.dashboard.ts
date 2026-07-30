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
