import { Component, OnInit } from '@angular/core';
import { DashboardService } from '../../core/services/dashboard.service';
import { InventoryService } from '../../core/services/inventory.service';
import { OrderService } from '../../core/services/order.service';
import { ShipmentService } from '../../core/services/shipment.service';
import { DashboardSummaryData, Order, Shipment, ApiInventoryItem } from '../../core/models/index';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {

  loading = true;
  summary: DashboardSummaryData | null = null;
  recentOrders: Order[] = [];
  recentShipments: Shipment[] = [];
  lowStockList: ApiInventoryItem[] = [];

  constructor(
    private dashboardService: DashboardService,
    private orderService: OrderService,
    private shipmentService: ShipmentService,
    private inventoryService: InventoryService
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.loading = true;

    // Load GET /api/dashboard/summary
    this.dashboardService.getSummary().subscribe({
      next: (data) => {
        this.summary = data;
        this.loading = false;
      },
      error: () => {
        // Fallback preview data if server is offline
        this.summary = {
          totalUsers: 24,
          activeUsers: 20,
          totalProducts: 124,
          activeProducts: 118,
          totalWarehouses: 6,
          activeWarehouses: 6,
          totalOnHandQuantity: 12500,
          totalAllocatedQuantity: 1200,
          totalAvailableQuantity: 11300,
          lowStockInventoryCount: 8,
          totalOrders: 145,
          createdOrders: 12,
          approvedOrders: 18,
          packedOrders: 15,
          dispatchedOrders: 27,
          deliveredOrders: 68,
          cancelledOrders: 5,
          totalOrderValue: 284500,
          totalShipments: 110,
          createdShipments: 10,
          inTransitShipments: 27,
          deliveredShipments: 68,
          cancelledShipments: 5
        };
        this.loading = false;
      }
    });

    // Load Recent Orders
    this.orderService.getOrders({ page: 0, size: 5, sort: 'createdAt,desc' }).subscribe({
      next: (res) => {
        this.recentOrders = res.orders || [];
      },
      error: () => {
        this.orderService.getAll().subscribe(list => {
          this.recentOrders = (list || []).slice(0, 5);
        });
      }
    });

    // Load Recent Shipments
    this.shipmentService.getShipments({ page: 0, size: 5, sort: 'createdAt,desc' }).subscribe({
      next: (res) => {
        this.recentShipments = res.shipments || [];
      },
      error: () => {
        this.shipmentService.getAll().subscribe(list => {
          this.recentShipments = (list || []).slice(0, 5);
        });
      }
    });

    // Load Low Stock Items
    this.inventoryService.getInventory({ page: 0, size: 5, sort: 'availableQuantity,asc' }).subscribe({
      next: (res) => {
        this.lowStockList = (res.products || []).filter(p => p.lowStock || p.outOfStock || p.availableQuantity <= p.lowStockThreshold).slice(0, 5);
      },
      error: () => {}
    });
  }

  getOrderTotalItems(o: Order): number {
    return o.items ? o.items.reduce((s, i) => s + i.quantity, 0) : 0;
  }

  getOrderTotalPrice(o: Order): number {
    return o.items ? o.items.reduce((s, i) => s + (i.unitPrice * i.quantity), 0) : (o.totalAmount || 0);
  }

  getStatusClass(status: string): string {
    const s = String(status || '').toUpperCase();
    if (s === 'DELIVERED' || s === 'APPROVED') return 'badge-success';
    if (s === 'IN_TRANSIT' || s === 'DISPATCHED' || s === 'PACKED') return 'badge-primary';
    if (s === 'CREATED' || s === 'PENDING') return 'badge-warning';
    if (s === 'CANCELLED' || s === 'REJECTED') return 'badge-danger';
    return 'badge-secondary';
  }
}
