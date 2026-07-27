import { Component, OnInit } from '@angular/core';
import { InventoryService } from '../../../core/services/inventory.service';
import { OrderService } from '../../../core/services/order.service';
import { ShipmentService } from '../../../core/services/shipment.service';
import { InventoryRow, Order, Shipment } from '../../../core/models/index';

export type ReportTab = 'inventory' | 'orders' | 'shipments';

/** Flat shape used by the inventory tab template */
export interface InventoryReportRow {
  name: string;
  sku: string;
  location: string;
  stockLevel: number;
  unitPrice: number;
  status: string;
}

/** Flat shape used by the orders tab template */
export interface OrderReportRow {
  orderId: string;
  sku: string;
  customer: string;
  totalItems: number;
  totalPrice: number;
  status: string;
}

/** Flat shape used by the shipments tab template */
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
  loading = true;

  startDate         = '';
  endDate           = '';
  selectedWarehouse = 'All Warehouses';
  selectedStatus    = 'All Statuses';
  currentPage       = 1;

  // Raw data
  private inventoryRows: InventoryRow[] = [];
  private orders: Order[]               = [];
  private shipments: Shipment[]         = [];

  toastMessage: string | null = null;

  constructor(
    private inventoryService: InventoryService,
    private orderService: OrderService,
    private shipmentService: ShipmentService,
  ) {}

  ngOnInit(): void {
    let done = 0;
    const check = () => { if (++done === 3) this.loading = false; };
    this.inventoryService.getAll().subscribe(d => { this.inventoryRows = d; check(); });
    this.orderService.getAll().subscribe(d => { this.orders = d; check(); });
    this.shipmentService.getAll().subscribe(d => { this.shipments = d; check(); });
  }

  setTab(tab: ReportTab): void {
    this.activeTab      = tab;
    this.selectedStatus = 'All Statuses';
    this.currentPage    = 1;
  }

  get isInvalidDateRange(): boolean {
    if (!this.startDate || !this.endDate) return false;
    return this.startDate > this.endDate;
  }

  // ── Warehouse list for filter dropdown ────────────────────
  get warehouses(): string[] {
    const names = [...new Set(this.inventoryRows.map(r => r.warehouseName))];
    return ['All Warehouses', ...names];
  }

  // ── Status options per tab ────────────────────────────────
  get statusOptions(): string[] {
    switch (this.activeTab) {
      case 'inventory':  return ['All Statuses', 'In Stock', 'Low Stock', 'Out of Stock'];
      case 'orders':     return ['All Statuses', 'Created', 'Approved', 'Dispatched', 'Delivered', 'Rejected', 'Cancelled'];
      case 'shipments':  return ['All Statuses', 'Created', 'Ready for Dispatch', 'In Transit', 'Delivered', 'Returned'];
    }
  }

  // ── Inventory tab data (maps InventoryRow → InventoryReportRow) ────
  get filteredProducts(): InventoryReportRow[] {
    return this.inventoryRows
      .filter(r => {
        const matchWh  = this.selectedWarehouse === 'All Warehouses' || r.warehouseName === this.selectedWarehouse;
        const label    = this.stockLabel(r);
        const matchSt  = this.selectedStatus  === 'All Statuses'    || label === this.selectedStatus;
        return matchWh && matchSt;
      })
      .map(r => ({
        name:       r.productName,
        sku:        r.sku,
        location:   r.warehouseName,
        stockLevel: r.availableQty,
        unitPrice:  0,          // unit price not in InventoryRow; enrich when needed
        status:     this.stockLabel(r),
      }));
  }

  // ── Orders tab data ───────────────────────────────────────
  get filteredOrders(): OrderReportRow[] {
    return this.orders
      .filter(o => this.selectedStatus === 'All Statuses' || o.status === this.selectedStatus)
      .map(o => ({
        orderId:    o.id,
        sku:        o.items.map(i => i.productId).join(', '),
        customer:   o.customerName,
        totalItems: o.items.reduce((s, i) => s + i.quantity, 0),
        totalPrice: o.items.reduce((s, i) => s + i.unitPrice * i.quantity, 0),
        status:     o.status,
      }));
  }

  // ── Shipments tab data ────────────────────────────────────
  get filteredShipments(): ShipmentReportRow[] {
    return this.shipments
      .filter(s => this.selectedStatus === 'All Statuses' || s.status === this.selectedStatus)
      .map(s => ({
        shipmentId:   s.id,
        orderId:      s.orderId,
        customer:     s.customerName,
        carrier:      s.carrierName,
        dispatchDate: s.dispatchDate,
        status:       s.status,
      }));
  }

  // ── Helpers ───────────────────────────────────────────────
  private stockLabel(r: InventoryRow): string {
    if (r.availableQty === 0) return 'Out of Stock';
    if (r.availableQty <= r.threshold) return 'Low Stock';
    return 'In Stock';
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

  exportPDF(): void   { this.showToast('📄 Exporting Report to PDF file...'); }
  exportExcel(): void { this.showToast('📊 Exporting Report to Excel spreadsheet...'); }

  showToast(msg: string): void {
    this.toastMessage = msg;
    setTimeout(() => { this.toastMessage = null; }, 3500);
  }
}
