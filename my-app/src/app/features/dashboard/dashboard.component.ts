import { Component, OnInit } from '@angular/core';
import { DashboardService } from '../../core/services/dashboard.service';
import { InventoryService } from '../../core/services/inventory.service';
import { OrderService } from '../../core/services/order.service';
import { ShipmentService } from '../../core/services/shipment.service';
import { DashboardSummaryData, Order, Shipment, ApiInventoryItem } from '../../core/models/index';

export interface CalendarDay {
  date: number;
  isToday: boolean;
  isCurrentMonth: boolean;
}

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

  // Calendar State
  currentDate = new Date();
  currentMonth: number = new Date().getMonth();
  currentYear: number = new Date().getFullYear();
  todayDate: number = new Date().getDate();
  todayMonth: number = new Date().getMonth();
  todayYear: number = new Date().getFullYear();
  calendarDays: CalendarDay[] = [];
  weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  constructor(
    private dashboardService: DashboardService,
    private orderService: OrderService,
    private shipmentService: ShipmentService,
    private inventoryService: InventoryService
  ) {}

  ngOnInit(): void {
    this.generateCalendar();
    this.loadDashboardData();
  }

  generateCalendar(): void {
    this.calendarDays = [];
    const firstDay = new Date(this.currentYear, this.currentMonth, 1).getDay();
    const totalDays = new Date(this.currentYear, this.currentMonth + 1, 0).getDate();
    const prevMonthDays = new Date(this.currentYear, this.currentMonth, 0).getDate();

    // Previous month padding days
    for (let i = firstDay - 1; i >= 0; i--) {
      this.calendarDays.push({
        date: prevMonthDays - i,
        isToday: false,
        isCurrentMonth: false
      });
    }

    // Current month days
    for (let d = 1; d <= totalDays; d++) {
      const isToday = (d === this.todayDate && this.currentMonth === this.todayMonth && this.currentYear === this.todayYear);
      this.calendarDays.push({
        date: d,
        isToday,
        isCurrentMonth: true
      });
    }

    // Next month padding days to make grid complete (35 cells)
    const remaining = 35 - this.calendarDays.length;
    if (remaining > 0) {
      for (let n = 1; n <= remaining; n++) {
        this.calendarDays.push({
          date: n,
          isToday: false,
          isCurrentMonth: false
        });
      }
    }
  }

  prevMonth(): void {
    if (this.currentMonth === 0) {
      this.currentMonth = 11;
      this.currentYear--;
    } else {
      this.currentMonth--;
    }
    this.generateCalendar();
  }

  nextMonth(): void {
    if (this.currentMonth === 11) {
      this.currentMonth = 0;
      this.currentYear++;
    } else {
      this.currentMonth++;
    }
    this.generateCalendar();
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
          totalOnHandQuantity: 125000,
          totalAllocatedQuantity: 12000,
          totalAvailableQuantity: 113000,
          lowStockInventoryCount: 8,
          totalOrders: 145,
          createdOrders: 12,
          approvedOrders: 18,
          packedOrders: 15,
          dispatchedOrders: 27,
          deliveredOrders: 68,
          cancelledOrders: 5,
          totalOrderValue: 2845000,
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

    // Load Low Stock Items via GET /api/inventory/lowstock
    this.inventoryService.getLowStockItemsApi({ page: 0, size: 5 }).subscribe({
      next: (res) => {
        this.lowStockList = res.products || [];
      },
      error: () => {
        // Fallback to standard inventory if lowstock endpoint is pending backend startup
        this.inventoryService.getInventory({ page: 0, size: 5, sort: 'availableQuantity,asc' }).subscribe({
          next: (res) => {
            this.lowStockList = (res.products || []).filter(p => p.lowStock || p.outOfStock || p.availableQuantity <= p.lowStockThreshold).slice(0, 5);
          },
          error: () => {}
        });
      }
    });
  }

  /**
   * Format numbers to Lakhs or Crores if val >= 100,000
   */
  formatNumber(val: number | undefined | null): string {
    if (val == null || isNaN(val)) return '0';
    if (val >= 10000000) { // 1 Crore = 100 Lakhs
      return (val / 10000000).toFixed(2) + ' Cr';
    }
    if (val >= 100000) { // 1 Lakh = 100,000
      return (val / 100000).toFixed(2) + ' Lakh';
    }
    return val.toLocaleString();
  }

  /**
   * Format currency values to Lakhs or Crores if val >= 100,000
   */
  formatAmount(val: number | undefined | null): string {
    if (val == null || isNaN(val)) return '$0';
    if (val >= 10000000) { // 1 Crore
      return '$' + (val / 10000000).toFixed(2) + ' Cr';
    }
    if (val >= 100000) { // 1 Lakh
      return '$' + (val / 100000).toFixed(2) + ' Lakh';
    }
    return '$' + val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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
