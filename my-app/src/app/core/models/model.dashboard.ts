export interface DashboardSummaryData {
  totalUsers: number;
  activeUsers: number;
  totalProducts: number;
  activeProducts: number;
  totalWarehouses: number;
  activeWarehouses: number;
  totalOnHandQuantity: number;
  totalAllocatedQuantity: number;
  totalAvailableQuantity: number;
  lowStockInventoryCount: number;
  totalOrders: number;
  createdOrders: number;
  approvedOrders: number;
  packedOrders: number;
  dispatchedOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  totalOrderValue: number;
  totalShipments: number;
  createdShipments: number;
  inTransitShipments: number;
  deliveredShipments: number;
  cancelledShipments: number;
}

export interface DashboardSummaryApiResponse {
  success: boolean;
  message: string;
  timestamp?: string;
  data: DashboardSummaryData;
}

/** Backward compatibility interface */
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
