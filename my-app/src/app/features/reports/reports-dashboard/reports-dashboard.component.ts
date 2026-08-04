import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { InventoryService } from '../../../core/services/inventory.service';
import { WarehouseService } from '../../../core/services/warehouse.service';
import { ProductService } from '../../../core/services/product.service';
import { OrderService } from '../../../core/services/order.service';
import { ShipmentService } from '../../../core/services/shipment.service';
import {
  ApiInventoryItem,
  InventoryListParams,
  OrderListParams,
  ShipmentListParams,
  Warehouse,
  Product,
  Order,
  Shipment
} from '../../../core/models/index';

export type ReportTab = 'inventory' | 'orders' | 'shipments';

@Component({
  selector: 'app-reports-dashboard',
  templateUrl: './reports-dashboard.component.html',
  styleUrls: ['./reports-dashboard.component.scss']
})
export class ReportsDashboardComponent implements OnInit, OnDestroy {

  activeTab: ReportTab = 'inventory';
  loading = false;

  // Filters matching GET API query params
  searchQuery = '';
  selectedWarehouseId: number | string = '';
  selectedProductId: number | string = '';
  selectedStatus = '';
  selectedCreatedBy = '';
  sort = 'createdAt,desc';

  // Pagination
  page = 0;
  size = 10;
  totalElements = 0;
  totalPages = 0;

  // Data lists
  inventoryItems: ApiInventoryItem[] = [];
  ordersList: Order[] = [];
  shipmentsList: Shipment[] = [];
  warehouses: Warehouse[] = [];
  productsList: Product[] = [];

  toastMessage: string | null = null;

  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  constructor(
    private inventoryService: InventoryService,
    private warehouseService: WarehouseService,
    private productService: ProductService,
    private orderService: OrderService,
    private shipmentService: ShipmentService,
  ) {}

  ngOnInit(): void {
    // Setup 1-second debounce for search query across all tabs
    this.searchSubject.pipe(
      debounceTime(1000),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(term => {
      this.searchQuery = term;
      this.page = 0;
      this.loadActiveReport();
    });

    this.loadWarehouses();
    this.loadProducts();
    this.loadActiveReport();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSearchInput(term: string): void {
    this.searchSubject.next(term);
  }

  setTab(tab: ReportTab): void {
    this.activeTab = tab;
    this.searchQuery = '';
    this.selectedWarehouseId = '';
    this.selectedProductId = '';
    this.selectedStatus = '';
    this.selectedCreatedBy = '';
    this.sort = tab === 'inventory' ? 'updatedAt,desc' : 'createdAt,desc';
    this.page = 0;
    this.loadActiveReport();
  }

  loadActiveReport(): void {
    if (this.activeTab === 'inventory') {
      this.loadInventoryReport();
    } else if (this.activeTab === 'orders') {
      this.loadOrdersReport();
    } else if (this.activeTab === 'shipments') {
      this.loadShipmentsReport();
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
      sort: this.sort || 'updatedAt,desc'
    };

    if (this.searchQuery.trim()) params.search = this.searchQuery.trim();
    if (this.selectedWarehouseId !== '') params.warehouseId = this.selectedWarehouseId;
    if (this.selectedProductId !== '') params.productId = this.selectedProductId;

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

  loadOrdersReport(): void {
    this.loading = true;
    const params: OrderListParams = {
      page: this.page,
      size: this.size,
      sort: this.sort || 'createdAt,desc'
    };

    if (this.searchQuery.trim()) params.search = this.searchQuery.trim();
    if (this.selectedStatus) params.status = this.selectedStatus;
    if (this.selectedWarehouseId !== '') params.warehouseId = this.selectedWarehouseId;
    if (this.selectedCreatedBy.trim()) params.createdBy = this.selectedCreatedBy.trim();

    this.orderService.getOrders(params).subscribe({
      next: (res) => {
        this.ordersList = res.orders || [];
        this.totalElements = res.totalElements || 0;
        this.totalPages = res.totalPages || 0;
        this.loading = false;
      },
      error: (err) => {
        this.showToast(err?.message || 'Failed to fetch order report.');
        this.loading = false;
      }
    });
  }

  loadShipmentsReport(): void {
    this.loading = true;
    const params: ShipmentListParams = {
      page: this.page,
      size: this.size,
      sort: this.sort || 'createdAt,desc'
    };

    if (this.searchQuery.trim()) params.search = this.searchQuery.trim();
    if (this.selectedStatus) params.status = this.selectedStatus;
    if (this.selectedCreatedBy.trim()) params.createdBy = this.selectedCreatedBy.trim();

    this.shipmentService.getShipments(params).subscribe({
      next: (res) => {
        this.shipmentsList = res.shipments || [];
        this.totalElements = res.totalElements || 0;
        this.totalPages = res.totalPages || 0;
        this.loading = false;
      },
      error: (err) => {
        this.showToast(err?.message || 'Failed to fetch shipment report.');
        this.loading = false;
      }
    });
  }

  onFilterChange(): void {
    this.page = 0;
    this.loadActiveReport();
  }

  resetFilters(): void {
    this.searchQuery = '';
    this.selectedWarehouseId = '';
    this.selectedProductId = '';
    this.selectedStatus = '';
    this.selectedCreatedBy = '';
    this.sort = this.activeTab === 'inventory' ? 'updatedAt,desc' : 'createdAt,desc';
    this.page = 0;
    this.loadActiveReport();
  }

  goToPage(p: number): void {
    if (p < 0 || (this.totalPages > 0 && p >= this.totalPages)) return;
    this.page = p;
    this.loadActiveReport();
  }

  // Stock Status Client-Side Filter for Inventory
  get filteredInventory(): ApiInventoryItem[] {
    if (this.selectedStatus === 'LOW_STOCK') {
      return this.inventoryItems.filter(i => i.lowStock || (i.availableQuantity <= i.lowStockThreshold && i.availableQuantity > 0));
    }
    if (this.selectedStatus === 'OUT_OF_STOCK') {
      return this.inventoryItems.filter(i => i.outOfStock || i.availableQuantity === 0);
    }
    if (this.selectedStatus === 'IN_STOCK') {
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

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      'In Stock':           'status-in-stock',
      'APPROVED':           'status-in-stock',
      'Approved':           'status-in-stock',
      'DELIVERED':          'status-in-stock',
      'Delivered':          'status-in-stock',
      'Low Stock':          'status-low-stock',
      'Out of Stock':       'status-out-of-stock',
      'CANCELLED':          'status-out-of-stock',
      'Cancelled':          'status-out-of-stock',
      'REJECTED':           'status-out-of-stock',
      'Rejected':           'status-out-of-stock',
      'CREATED':            'status-critical',
      'Created':            'status-critical',
      'PACKED':             'status-critical',
      'Packed':             'status-critical',
      'IN_TRANSIT':         'status-critical',
      'In Transit':         'status-critical',
    };
    return map[status] || '';
  }

  getOrderTotalItems(order: Order): number {
    return order.items ? order.items.reduce((s, i) => s + i.quantity, 0) : 0;
  }

  getOrderTotalPrice(order: Order): number {
    return order.items ? order.items.reduce((s, i) => s + (i.unitPrice * i.quantity), 0) : (order.totalAmount || 0);
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
      this.downloadCsv(csv, `inventory_report_${new Date().toISOString().split('T')[0]}.csv`);
      this.showToast('📊 Inventory report exported to CSV / Excel!');
    } else if (this.activeTab === 'orders') {
      const items = this.ordersList;
      if (!items.length) {
        this.showToast('No order records available to export.');
        return;
      }
      let csv = 'Order Number,Customer Name,Warehouse,Total Items,Total Price,Status,Created At\n';
      items.forEach(o => {
        const count = this.getOrderTotalItems(o);
        const total = this.getOrderTotalPrice(o);
        csv += `"${o.orderNumber || o.id}","${o.customerName || ''}","${o.warehouseName || ''}",${count},${total},"${o.status}","${o.createdAt || ''}"\n`;
      });
      this.downloadCsv(csv, `orders_report_${new Date().toISOString().split('T')[0]}.csv`);
      this.showToast('📊 Order report exported to CSV / Excel!');
    } else if (this.activeTab === 'shipments') {
      const items = this.shipmentsList;
      if (!items.length) {
        this.showToast('No shipment records available to export.');
        return;
      }
      let csv = 'Shipment Ref,Order Ref,Customer Name,Carrier,Tracking Number,Status,Expected Delivery Date\n';
      items.forEach(s => {
        csv += `"${s.shipmentNumber || s.id}","${s.orderNumber || s.orderId}","${s.customerName || ''}","${s.carrierName || ''}","${s.trackingNumber || ''}","${s.status}","${s.expectedDeliveryDate || ''}"\n`;
      });
      this.downloadCsv(csv, `shipments_report_${new Date().toISOString().split('T')[0]}.csv`);
      this.showToast('📊 Shipment report exported to CSV / Excel!');
    }
  }

  private downloadCsv(csvContent: string, fileName: string): void {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    link.click();
  }

  // Export to PDF
  exportPDF(): void {
    if (this.activeTab === 'inventory') {
      this.exportInventoryPDF();
    } else if (this.activeTab === 'orders') {
      this.exportOrdersPDF();
    } else if (this.activeTab === 'shipments') {
      this.exportShipmentsPDF();
    }
  }

  private exportInventoryPDF(): void {
    const items = this.filteredInventory;
    if (!items.length) {
      this.showToast('No inventory records available to export.');
      return;
    }

    const printWin = window.open('', '_blank', 'width=950,height=750');
    if (!printWin) {
      this.showToast('Could not open print window. Please allow popups in your browser.');
      return;
    }

    const dateStr = new Date().toLocaleString();
    const whName = this.selectedWarehouseId 
      ? (this.warehouses.find(w => String(w.id) === String(this.selectedWarehouseId))?.name || 'Selected Warehouse') 
      : 'All Warehouses';

    const rowsHtml = items.map(item => `
      <tr>
        <td style="padding:8px 10px; border:1px solid #cbd5e1; font-family:monospace; font-weight:bold;">INV-${item.inventoryId || item.productId}</td>
        <td style="padding:8px 10px; border:1px solid #cbd5e1; font-weight:600;">${item.productName || ''}</td>
        <td style="padding:8px 10px; border:1px solid #cbd5e1;">${item.warehouseName || ''}</td>
        <td style="padding:8px 10px; border:1px solid #cbd5e1; text-align:right;">${item.onHandQuantity ?? 0}</td>
        <td style="padding:8px 10px; border:1px solid #cbd5e1; text-align:right; color:#64748b;">${item.allocatedQuantity ?? 0}</td>
        <td style="padding:8px 10px; border:1px solid #cbd5e1; text-align:right; font-weight:bold;">${item.availableQuantity ?? 0}</td>
        <td style="padding:8px 10px; border:1px solid #cbd5e1; text-align:right;">${item.lowStockThreshold ?? 0}</td>
        <td style="padding:8px 10px; border:1px solid #cbd5e1; font-size:12px; font-weight:bold;">${this.getStockLabel(item)}</td>
      </tr>
    `).join('');

    this.renderAndPrintHtml(printWin, 'SCIDMS Inventory Report', dateStr, `Warehouse: ${whName} | Stock Status: ${this.selectedStatus || 'ALL'} | Total Items: ${items.length}`, `
      <thead>
        <tr>
          <th>Inventory ID</th>
          <th>Product Name</th>
          <th>Warehouse Location</th>
          <th style="text-align:right;">On-Hand Qty</th>
          <th style="text-align:right;">Allocated Qty</th>
          <th style="text-align:right;">Available Qty</th>
          <th style="text-align:right;">Threshold</th>
          <th>Stock Status</th>
        </tr>
      </thead>
      <tbody>${rowsHtml}</tbody>
    `);
  }

  private exportOrdersPDF(): void {
    const items = this.ordersList;
    if (!items.length) {
      this.showToast('No order records available to export.');
      return;
    }

    const printWin = window.open('', '_blank', 'width=950,height=750');
    if (!printWin) {
      this.showToast('Could not open print window. Please allow popups.');
      return;
    }

    const dateStr = new Date().toLocaleString();
    const rowsHtml = items.map(o => `
      <tr>
        <td style="padding:8px 10px; border:1px solid #cbd5e1; font-weight:bold;">${o.orderNumber || o.id}</td>
        <td style="padding:8px 10px; border:1px solid #cbd5e1; font-weight:600;">${o.customerName || ''}</td>
        <td style="padding:8px 10px; border:1px solid #cbd5e1;">${o.warehouseName || 'All Warehouses'}</td>
        <td style="padding:8px 10px; border:1px solid #cbd5e1; text-align:right;">${this.getOrderTotalItems(o)}</td>
        <td style="padding:8px 10px; border:1px solid #cbd5e1; text-align:right; font-weight:bold;">$${this.getOrderTotalPrice(o).toFixed(2)}</td>
        <td style="padding:8px 10px; border:1px solid #cbd5e1; font-size:12px; font-weight:bold;">${o.status}</td>
        <td style="padding:8px 10px; border:1px solid #cbd5e1; font-size:11px; color:#64748b;">${o.createdAt || ''}</td>
      </tr>
    `).join('');

    this.renderAndPrintHtml(printWin, 'SCIDMS Order Report', dateStr, `Search: "${this.searchQuery || 'None'}" | Status: ${this.selectedStatus || 'All'} | Total Orders: ${items.length}`, `
      <thead>
        <tr>
          <th>Order Number</th>
          <th>Customer Name</th>
          <th>Warehouse</th>
          <th style="text-align:right;">Total Items</th>
          <th style="text-align:right;">Total Price</th>
          <th>Status</th>
          <th>Created Date</th>
        </tr>
      </thead>
      <tbody>${rowsHtml}</tbody>
    `);
  }

  private exportShipmentsPDF(): void {
    const items = this.shipmentsList;
    if (!items.length) {
      this.showToast('No shipment records available to export.');
      return;
    }

    const printWin = window.open('', '_blank', 'width=950,height=750');
    if (!printWin) {
      this.showToast('Could not open print window. Please allow popups.');
      return;
    }

    const dateStr = new Date().toLocaleString();
    const rowsHtml = items.map(s => `
      <tr>
        <td style="padding:8px 10px; border:1px solid #cbd5e1; font-family:monospace; font-weight:bold;">${s.shipmentNumber || s.id}</td>
        <td style="padding:8px 10px; border:1px solid #cbd5e1;">${s.orderNumber || s.orderId}</td>
        <td style="padding:8px 10px; border:1px solid #cbd5e1; font-weight:600;">${s.customerName || ''}</td>
        <td style="padding:8px 10px; border:1px solid #cbd5e1;">${s.carrierName || ''}</td>
        <td style="padding:8px 10px; border:1px solid #cbd5e1; font-family:monospace;">${s.trackingNumber || 'N/A'}</td>
        <td style="padding:8px 10px; border:1px solid #cbd5e1; font-size:12px; font-weight:bold;">${s.status}</td>
        <td style="padding:8px 10px; border:1px solid #cbd5e1; font-size:11px; color:#64748b;">${s.expectedDeliveryDate || s.createdAt}</td>
      </tr>
    `).join('');

    this.renderAndPrintHtml(printWin, 'SCIDMS Shipment Report', dateStr, `Search: "${this.searchQuery || 'None'}" | Status: ${this.selectedStatus || 'All'} | Total Shipments: ${items.length}`, `
      <thead>
        <tr>
          <th>Shipment Ref</th>
          <th>Order Ref</th>
          <th>Customer Name</th>
          <th>Carrier</th>
          <th>Tracking Number</th>
          <th>Status</th>
          <th>Expected Delivery</th>
        </tr>
      </thead>
      <tbody>${rowsHtml}</tbody>
    `);
  }

  private renderAndPrintHtml(printWin: Window, reportTitle: string, dateStr: string, filterInfo: string, tableInnerHtml: string): void {
    printWin.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${reportTitle}</title>
          <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; padding: 24px; color: #0f172a; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 20px; }
            .title { font-size: 22px; font-weight: bold; margin: 0; }
            .meta { font-size: 12px; color: #64748b; margin-top: 4px; }
            .info-bar { background: #f8fafc; border: 1px solid #e2e8f0; padding: 10px 14px; border-radius: 6px; font-size: 13px; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; font-size: 13px; }
            th { background: #0f172a; color: #ffffff; padding: 10px 8px; text-align: left; border: 1px solid #0f172a; }
            .footer { margin-top: 24px; font-size: 11px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 12px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1 class="title">${reportTitle}</h1>
              <div class="meta">Generated on: ${dateStr}</div>
            </div>
            <div style="text-align:right;">
              <strong>SCIDMS Supply Chain Management</strong>
            </div>
          </div>

          <div class="info-bar">
            <strong>Applied Filters:</strong> ${filterInfo}
          </div>

          <table>
            ${tableInnerHtml}
          </table>

          <div class="footer">
            Confidential Supply Chain Management Report · SCIDMS Platform
          </div>
        </body>
      </html>
    `);

    printWin.document.close();
    printWin.focus();
    setTimeout(() => {
      printWin.print();
      printWin.close();
    }, 300);

    this.showToast(`📄 ${reportTitle} exported as PDF!`);
  }

  showToast(msg: string): void {
    this.toastMessage = msg;
    setTimeout(() => { this.toastMessage = null; }, 3500);
  }
}
