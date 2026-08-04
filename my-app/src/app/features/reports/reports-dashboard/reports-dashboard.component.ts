import { Component, OnInit } from '@angular/core';
import { InventoryService } from '../../../core/services/inventory.service';
import { WarehouseService } from '../../../core/services/warehouse.service';
import { ProductService } from '../../../core/services/product.service';
import { OrderService } from '../../../core/services/order.service';
import { ShipmentService } from '../../../core/services/shipment.service';
import {
  ApiInventoryItem,
  InventoryListParams,
  Warehouse,
  Product,
  Order,
  Shipment
} from '../../../core/models/index';

export type ReportTab = 'inventory' | 'orders' | 'shipments';

/** Flat shape used by orders tab template */
export interface OrderReportRow {
  orderId: string;
  sku: string;
  customer: string;
  totalItems: number;
  totalPrice: number;
  status: string;
}

/** Flat shape used by shipments tab template */
export interface ShipmentReportRow {
  shipmentId: string;
  orderId: string;
  customer: string;
  carrier: string;
  dispatchDate: string;
  status: string;
}

@Component({
  selector: 'app-reports-dashboard',
  templateUrl: './reports-dashboard.component.html',
  styleUrls: ['./reports-dashboard.component.scss']
})
export class ReportsDashboardComponent implements OnInit {

  activeTab: ReportTab = 'inventory';
  loading = false;

  // Filters matching GET /api/inventory params
  searchQuery = '';
  selectedWarehouseId: number | string = '';
  selectedProductId: number | string = '';
  selectedStockStatus = 'ALL'; // ALL, IN_STOCK, LOW_STOCK, OUT_OF_STOCK

  // Pagination
  page = 0;
  size = 10;
  sort = 'updatedAt,desc';
  totalElements = 0;
  totalPages = 0;

  // Data lists
  inventoryItems: ApiInventoryItem[] = [];
  warehouses: Warehouse[] = [];
  productsList: Product[] = [];
  orders: Order[] = [];
  shipments: Shipment[] = [];

  toastMessage: string | null = null;

  constructor(
    private inventoryService: InventoryService,
    private warehouseService: WarehouseService,
    private productService: ProductService,
    private orderService: OrderService,
    private shipmentService: ShipmentService,
  ) {}

  ngOnInit(): void {
    this.loadWarehouses();
    this.loadProducts();
    this.loadInventoryReport();
    this.loadOrdersAndShipments();
  }

  setTab(tab: ReportTab): void {
    this.activeTab = tab;
    this.page = 0;
    if (tab === 'inventory') {
      this.loadInventoryReport();
    }
  }

  loadWarehouses(): void {
    this.warehouseService.getAll({ size: 100 }).subscribe({
      next: (res) => {
        this.warehouses = res.warehouses || [];
      },
      error: () => {}
    });
  }

  loadProducts(): void {
    this.productService.getAll({ size: 100 }).subscribe({
      next: (res) => {
        this.productsList = res.products || [];
      },
      error: () => {}
    });
  }

  loadInventoryReport(): void {
    this.loading = true;
    const params: InventoryListParams = {
      page: this.page,
      size: this.size,
      sort: this.sort
    };

    if (this.searchQuery.trim()) {
      params.search = this.searchQuery.trim();
    }
    if (this.selectedWarehouseId !== '') {
      params.warehouseId = this.selectedWarehouseId;
    }
    if (this.selectedProductId !== '') {
      params.productId = this.selectedProductId;
    }

    this.inventoryService.getInventory(params).subscribe({
      next: (res) => {
        this.inventoryItems = res.products || [];
        this.totalElements = res.totalElements || 0;
        this.totalPages = res.totalPages || 0;
        this.loading = false;
      },
      error: (err) => {
        this.showToast(err?.message || 'Failed to fetch inventory report.');
        this.loading = false;
      }
    });
  }

  loadOrdersAndShipments(): void {
    this.orderService.getAll().subscribe({
      next: (d) => { this.orders = d || []; },
      error: () => {}
    });

    this.shipmentService.getAll().subscribe({
      next: (d) => { this.shipments = d || []; },
      error: () => {}
    });
  }

  onFilterChange(): void {
    this.page = 0;
    this.loadInventoryReport();
  }

  resetFilters(): void {
    this.searchQuery = '';
    this.selectedWarehouseId = '';
    this.selectedProductId = '';
    this.selectedStockStatus = 'ALL';
    this.page = 0;
    this.loadInventoryReport();
  }

  goToPage(p: number): void {
    if (p < 0 || (this.totalPages > 0 && p >= this.totalPages)) return;
    this.page = p;
    this.loadInventoryReport();
  }

  // Stock Status Client-Side Filter
  get filteredInventory(): ApiInventoryItem[] {
    if (this.selectedStockStatus === 'LOW_STOCK') {
      return this.inventoryItems.filter(i => i.lowStock || (i.availableQuantity <= i.lowStockThreshold && i.availableQuantity > 0));
    }
    if (this.selectedStockStatus === 'OUT_OF_STOCK') {
      return this.inventoryItems.filter(i => i.outOfStock || i.availableQuantity === 0);
    }
    if (this.selectedStockStatus === 'IN_STOCK') {
      return this.inventoryItems.filter(i => !i.lowStock && !i.outOfStock && i.availableQuantity > i.lowStockThreshold);
    }
    return this.inventoryItems;
  }

  getStockBadgeClass(item: ApiInventoryItem): string {
    if (item.outOfStock || item.availableQuantity === 0) return 'status-out-of-stock';
    if (item.lowStock || item.availableQuantity <= item.lowStockThreshold) return 'status-low-stock';
    return 'status-in-stock';
  }

  getStockLabel(item: ApiInventoryItem): string {
    if (item.outOfStock || item.availableQuantity === 0) return 'Out of Stock';
    if (item.lowStock || item.availableQuantity <= item.lowStockThreshold) return 'Low Stock';
    return 'In Stock';
  }

  // Summary Metrics
  get lowStockAlertItems(): ApiInventoryItem[] {
    return this.inventoryItems
      .filter(i => i.lowStock || i.outOfStock || i.availableQuantity <= i.lowStockThreshold)
      .slice(0, 5);
  }

  calcPercentage(item: ApiInventoryItem): number {
    if (!item.lowStockThreshold || item.lowStockThreshold === 0) return item.availableQuantity > 0 ? 50 : 0;
    const pct = Math.round((item.availableQuantity / (item.lowStockThreshold * 2)) * 100);
    return Math.min(Math.max(pct, 5), 100);
  }

  // Orders tab data
  get filteredOrders(): OrderReportRow[] {
    return this.orders.map(o => ({
      orderId:    o.id,
      sku:        o.items.map(i => i.productId).join(', '),
      customer:   o.customerName,
      totalItems: o.items.reduce((s, i) => s + i.quantity, 0),
      totalPrice: o.items.reduce((s, i) => s + i.unitPrice * i.quantity, 0),
      status:     o.status,
    }));
  }

  // Shipments tab data
  get filteredShipments(): ShipmentReportRow[] {
    return this.shipments.map(s => ({
      shipmentId:   s.id,
      orderId:      s.orderId,
      customer:     s.customerName,
      carrier:      s.carrierName,
      dispatchDate: s.dispatchDate || s.createdAt,
      status:       s.status,
    }));
  }

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      'In Stock':           'status-in-stock',
      'Approved':           'status-in-stock',
      'Delivered':          'status-in-stock',
      'Low Stock':          'status-low-stock',
      'Out of Stock':       'status-out-of-stock',
      'Cancelled':          'status-out-of-stock',
      'Returned':           'status-out-of-stock',
      'Created':            'status-critical',
      'Pending':            'status-critical',
      'In Transit':         'status-critical',
      'Ready for Dispatch': 'status-critical',
    };
    return map[status] || '';
  }

  // Export to Excel / CSV
  exportExcel(): void {
    if (this.activeTab === 'inventory') {
      const items = this.filteredInventory;
      if (!items.length) {
        this.showToast('No inventory records available to export.');
        return;
      }

      let csv = 'Inventory ID,Product Name,Warehouse Location,On Hand Qty,Allocated Qty,Available Qty,Low Stock Threshold,Stock Status\n';
      items.forEach(item => {
        csv += `"${item.inventoryId || ''}","${item.productName || ''}","${item.warehouseName || ''}",${item.onHandQuantity},${item.allocatedQuantity},${item.availableQuantity},${item.lowStockThreshold},"${this.getStockLabel(item)}"\n`;
      });

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `inventory_report_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();

      this.showToast('📊 Inventory report exported to CSV / Excel spreadsheet!');
    } else {
      this.showToast('📊 Exporting Report...');
    }
  }

  // Export to PDF
  exportPDF(): void {
    window.print();
    this.showToast('📄 Printing / Exporting Report as PDF...');
  }

  showToast(msg: string): void {
    this.toastMessage = msg;
    setTimeout(() => { this.toastMessage = null; }, 3500);
  }
}
