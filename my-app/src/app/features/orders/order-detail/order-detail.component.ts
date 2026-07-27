import { Component, OnInit } from '@angular/core';
import { OrderService } from '../../../core/services/order.service';
import { Order, OrderStatus, OrderStatusEvent } from '../../../core/models/index';

const STEP_FLOW: OrderStatus[] = ['Created', 'Approved', 'Packed', 'Dispatched', 'Delivered'];

@Component({
  selector: 'app-order-detail',
  templateUrl: './order-detail.component.html',
  styleUrls: ['./order-detail.component.scss']
})
export class OrderDetailComponent implements OnInit {

  orders: Order[]     = [];
  loading = true;

  searchTerm      = '';
  filterStatus    = '';
  selectedOrderId = '';

  readonly stepFlow: OrderStatus[] = STEP_FLOW;
  statuses: OrderStatus[] = ['Created', 'Approved', 'Packed', 'Dispatched', 'Delivered', 'Rejected', 'Cancelled'];

  constructor(private orderService: OrderService) {}

  ngOnInit(): void {
    this.orderService.getAll().subscribe(data => {
      this.orders         = data;
      this.selectedOrderId = data[0]?.id || '';
      this.loading        = false;
    });
  }

  get selected(): Order | null {
    return this.orders.find(o => o.id === this.selectedOrderId) || null;
  }

  get filteredOrders(): Order[] {
    return this.orders.filter(o => {
      const s = this.searchTerm.toLowerCase();
      const matchSearch = !s || o.id.toLowerCase().includes(s) || o.customerName.toLowerCase().includes(s);
      const matchStatus = !this.filterStatus || o.status === this.filterStatus;
      return matchSearch && matchStatus;
    });
  }

  selectOrder(o: Order): void { this.selectedOrderId = o.id; }

  applyFilters(): void { /* filters are reactive via getter */ }

  // ── Stepper helpers ───────────────────────────────────────
  get isTerminated(): boolean {
    return this.selected?.status === 'Rejected' || this.selected?.status === 'Cancelled';
  }

  stepState(step: OrderStatus): 'completed' | 'current' | 'pending' {
    if (!this.selected) return 'pending';
    const curIdx  = STEP_FLOW.indexOf(this.selected.status);
    const stepIdx = STEP_FLOW.indexOf(step);
    if (this.isTerminated) return step === 'Created' ? 'completed' : 'pending';
    if (stepIdx < curIdx)  return 'completed';
    if (stepIdx === curIdx) return 'current';
    return 'pending';
  }

  stepTimestamp(step: OrderStatus): string {
    if (!this.selected) return '';
    const ev = this.selected.history.find((h: OrderStatusEvent) => h.status === step);
    return ev ? ev.timestamp : '';
  }

  orderTotal(o: Order): number { return o.items.reduce((s, i) => s + i.unitPrice * i.quantity, 0); }
  fmt(n: number): string { return '৳ ' + n.toLocaleString('en-BD'); }

  statusPillClass(s: OrderStatus): string {
    const m: Record<OrderStatus, string> = {
      Created: 'pill-created', Approved: 'pill-approved', Packed: 'pill-packed',
      Dispatched: 'pill-dispatched', Delivered: 'pill-delivered',
      Rejected: 'pill-rejected', Cancelled: 'pill-cancelled',
    };
    return m[s] || '';
  }

  priorityClass(p: string): string {
    return p === 'High' ? 'pri-high' : p === 'Medium' ? 'pri-medium' : 'pri-low';
  }
}
