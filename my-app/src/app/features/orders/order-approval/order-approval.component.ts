import { Component, OnInit } from '@angular/core';
import { OrderService } from '../../../core/services/order.service';
import { ProductService } from '../../../core/services/product.service';
import { Order, OrderItem, Product } from '../../../core/models/index';

/** Runtime state layered on top of each order for UI purposes */
interface OrderUI extends Order {
  expanded:        boolean;
  rejecting:       boolean;
  rejectionReason: string;
  rejectionError:  string;
  processing:      boolean;
  /** per-item available stock from the product catalogue */
  stockMap: Record<string, number>;
}

@Component({
  selector: 'app-order-approval',
  templateUrl: './order-approval.component.html',
  styleUrls: ['./order-approval.component.scss']
})
export class OrderApprovalComponent implements OnInit {

  pendingOrders: OrderUI[] = [];
  approvedOrders: OrderUI[] = [];
  rejectedOrders: OrderUI[] = [];
  loading = true;
  filterDateFrom = '';
  filterDateTo   = '';

  constructor(
    private orderService: OrderService,
    private productService: ProductService,
  ) {}

  private productStockMap: Record<string, number> = {};

  ngOnInit(): void {
    this.orderService.getAll().subscribe((orders: Order[]) => {
      this.productService.getAll().subscribe(products => {
        const prodList: Product[] = Array.isArray(products) ? products : (products as any).products || [];
        this.productStockMap = Object.fromEntries(prodList.map((p: Product) => [String(p.id), p.availableQty || 0]));
        const stockMap = this.productStockMap;
        const list: Order[] = Array.isArray(orders) ? orders : [];

        this.pendingOrders = list
          .filter(o => String(o.status).toUpperCase() === 'CREATED')
          .map(o => ({ ...o, expanded: false, rejecting: false, rejectionReason: '', rejectionError: '', processing: false, stockMap }));
        this.approvedOrders = list
          .filter(o => String(o.status).toUpperCase() === 'APPROVED')
          .map(o => ({ ...o, expanded: false, rejecting: false, rejectionReason: '', rejectionError: '', processing: false, stockMap }));
        this.rejectedOrders = list
          .filter(o => String(o.status).toUpperCase() === 'REJECTED' || String(o.status).toUpperCase() === 'CANCELLED')
          .map(o => ({ ...o, expanded: false, rejecting: false, rejectionReason: '', rejectionError: '', processing: false, stockMap }));
        this.loading = false;
      });
    });
  }

  // Getters used by the template
  get pending():  OrderUI[] { return this.pendingOrders; }
  get approved(): OrderUI[] { return this.approvedOrders; }
  get rejected(): OrderUI[] { return this.rejectedOrders; }

  get filtered(): OrderUI[] {
    return this.pendingOrders.filter(o => {
      if (!this.filterDateFrom && !this.filterDateTo) return true;
      const d    = this.toISO(o.orderDate);
      const from = this.filterDateFrom || '0000-01-01';
      const to   = this.filterDateTo   || '9999-12-31';
      return d >= from && d <= to;
    });
  }

  // ── Item helpers ──────────────────────────────────────────
  availableStock(item: OrderItem): number {
    return this.productStockMap[item.productId] ?? 0;
  }

  isInsufficient(item: OrderItem): boolean {
    return item.quantity > this.availableStock(item);
  }

  hasInsufficientItems(order: OrderUI): boolean {
    return order.items.some(i => this.isInsufficient(i));
  }

  orderTotal(order: Order): number { return order.items.reduce((s, i) => s + i.unitPrice * i.quantity, 0); }
  totalRequested(order: Order): number { return order.items.reduce((s, i) => s + i.quantity, 0); }

  stockHealthClass(item: OrderItem): string {
    const avail = this.availableStock(item);
    if (item.quantity > avail) return 'health-bad';
    if (avail - item.quantity < 10) return 'health-warn';
    return 'health-ok';
  }

  // ── Actions ───────────────────────────────────────────────
  toggleExpand(order: OrderUI): void {
    order.expanded = !order.expanded;
    if (!order.expanded) { order.rejecting = false; order.rejectionReason = ''; order.rejectionError = ''; }
  }

  startReject(order: OrderUI, e: Event): void {
    e.stopPropagation();
    order.rejecting       = true;
    order.expanded        = true;
    order.rejectionReason = '';
    order.rejectionError  = '';
  }

  cancelReject(order: OrderUI): void {
    order.rejecting       = false;
    order.rejectionReason = '';
    order.rejectionError  = '';
  }

  confirmReject(order: OrderUI): void {
    if (!order.rejectionReason.trim()) {
      order.rejectionError = 'Rejection reason is required before confirming.';
      return;
    }
    order.processing = true;
    this.orderService.updateOrderStatus(order.id, 'CANCELLED', order.rejectionReason).subscribe({
      next: (updated) => {
        this.pendingOrders  = this.pendingOrders.filter(o => o.id !== order.id);
        const updObj = updated || { ...order, status: 'CANCELLED' };
        this.rejectedOrders = [{ ...updObj, expanded: false, rejecting: false, rejectionReason: order.rejectionReason, rejectionError: '', processing: false, stockMap: this.productStockMap }, ...this.rejectedOrders];
      },
      error: (err) => {
        order.rejectionError = err?.message || 'Could not reject order.';
        order.processing     = false;
      },
    });
  }

  approveOrder(order: OrderUI, e: Event): void {
    e.stopPropagation();
    order.processing = true;
    this.orderService.approveOrder(order.id).subscribe({
      next: (updated) => {
        this.pendingOrders  = this.pendingOrders.filter(o => o.id !== order.id);
        const updObj = updated || { ...order, status: 'APPROVED' };
        this.approvedOrders = [{ ...updObj, expanded: false, rejecting: false, rejectionReason: '', rejectionError: '', processing: false, stockMap: this.productStockMap }, ...this.approvedOrders];
      },
      error: (err) => {
        order.rejectionError = err?.message || 'Could not approve order.';
        order.processing     = false;
      },
    });
  }

  fmt(n: number): string { return '৳ ' + n.toLocaleString('en-BD'); }

  private toISO(dateStr: string): string {
    const months: Record<string, string> = {
      Jan:'01', Feb:'02', Mar:'03', Apr:'04', May:'05', Jun:'06',
      Jul:'07', Aug:'08', Sep:'09', Oct:'10', Nov:'11', Dec:'12',
    };
    const parts = dateStr.split(' ');
    if (parts.length !== 3) return dateStr;
    return `${parts[2]}-${months[parts[1]] || '01'}-${parts[0].padStart(2, '0')}`;
  }
}
