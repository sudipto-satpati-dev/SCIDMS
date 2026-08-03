import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { OrderService } from '../../../core/services/order.service';
import { Order, OrderStatus, OrderHistoryItem } from '../../../core/models/index';

const STEP_FLOW: string[] = ['CREATED', 'APPROVED', 'PACKED', 'DISPATCHED', 'DELIVERED'];

@Component({
  selector: 'app-order-detail',
  templateUrl: './order-detail.component.html',
  styleUrls: ['./order-detail.component.scss']
})
export class OrderDetailComponent implements OnInit {

  orders: Order[] = [];
  selectedOrder: Order | null = null;
  orderHistory: OrderHistoryItem[] = [];

  loading = true;
  loadingHistory = false;
  errorMsg = '';

  searchTerm = '';
  filterStatus = '';
  selectedOrderId: string | number = '';

  readonly stepFlow: string[] = STEP_FLOW;
  readonly statuses: OrderStatus[] = ['CREATED', 'APPROVED', 'PACKED', 'DISPATCHED', 'DELIVERED', 'CANCELLED'];

  constructor(
    private orderService: OrderService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    const routeId = this.route.snapshot.paramMap.get('id');

    this.orderService.getAll().subscribe({
      next: (data) => {
        this.orders = data || [];
        const initialId = routeId || (data[0]?.id ? String(data[0].id) : '');
        if (initialId) {
          this.loadOrderDetail(initialId);
        } else {
          this.loading = false;
        }
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  loadOrderDetail(id: string | number): void {
    this.selectedOrderId = id;
    this.loading = true;
    this.errorMsg = '';

    this.orderService.getById(id).subscribe({
      next: (order) => {
        this.selectedOrder = order;
        this.loading = false;
        this.loadHistory(id);
      },
      error: (err) => {
        this.errorMsg = err?.message || 'Could not load order details.';
        this.loading = false;
      }
    });
  }

  loadHistory(id: string | number): void {
    this.loadingHistory = true;
    this.orderService.getOrderHistory(id).subscribe({
      next: (hist) => {
        this.orderHistory = hist || [];
        this.loadingHistory = false;
      },
      error: () => {
        this.orderHistory = [];
        this.loadingHistory = false;
      }
    });
  }

  selectOrder(o: Order): void {
    this.loadOrderDetail(o.id);
  }

  get selected(): Order | null {
    return this.selectedOrder;
  }

  get filteredOrders(): Order[] {
    return this.orders.filter(o => {
      const s = this.searchTerm.toLowerCase();
      const matchSearch = !s || String(o.id).toLowerCase().includes(s) || (o.orderNumber && o.orderNumber.toLowerCase().includes(s)) || o.customerName.toLowerCase().includes(s);
      const matchStatus = !this.filterStatus || String(o.status).toUpperCase() === this.filterStatus.toUpperCase();
      return matchSearch && matchStatus;
    });
  }

  applyFilters(): void {
    // Dynamic getter filteredOrders re-evaluates automatically
  }

  getApprovedByInitial(approvedBy?: string): string {
    return approvedBy && approvedBy.length > 0 ? approvedBy.charAt(0).toUpperCase() : '?';
  }

  // ── Stepper helpers ───────────────────────────────────────
  get isTerminated(): boolean {
    const s = String(this.selected?.status || '').toUpperCase();
    return s === 'REJECTED' || s === 'CANCELLED';
  }

  stepState(step: string): 'completed' | 'current' | 'pending' {
    if (!this.selected) return 'pending';
    const curStatus = String(this.selected.status || '').toUpperCase();
    const curIdx  = STEP_FLOW.indexOf(curStatus);
    const stepIdx = STEP_FLOW.indexOf(step);
    if (this.isTerminated) return step === 'CREATED' ? 'completed' : 'pending';
    if (stepIdx < curIdx)  return 'completed';
    if (stepIdx === curIdx) return 'current';
    return 'pending';
  }

  stepTimestamp(step: string): string {
    if (!this.orderHistory.length) return '';
    const ev = this.orderHistory.find(h => String(h.newStatus).toUpperCase() === step);
    return ev ? ev.changedAt : '';
  }

  orderTotal(o: Order): number {
    return o.totalAmount || (o.items ? o.items.reduce((s, i) => s + (i.lineTotal || (i.unitPrice * i.quantity)), 0) : 0);
  }

  fmt(n: number): string {
    return '$' + (n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  statusPillClass(s: string): string {
    const st = (s || '').toUpperCase();
    if (st === 'CREATED') return 'pill-created';
    if (st === 'APPROVED') return 'pill-approved';
    if (st === 'PACKED') return 'pill-packed';
    if (st === 'DISPATCHED') return 'pill-dispatched';
    if (st === 'DELIVERED') return 'pill-delivered';
    if (st === 'CANCELLED' || st === 'REJECTED') return 'pill-cancelled';
    return 'pill-created';
  }

  priorityClass(p: string): string {
    return p === 'High' ? 'pri-high' : p === 'Medium' ? 'pri-medium' : 'pri-low';
  }
}

