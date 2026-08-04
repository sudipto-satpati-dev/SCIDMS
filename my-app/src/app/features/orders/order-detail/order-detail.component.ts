import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { OrderService } from '../../../core/services/order.service';
import { InventoryService } from '../../../core/services/inventory.service';
import { AuthService } from '../../../core/services/auth.service';
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

  // Approval modal state
  showApprovalModal = false;
  loadingStock = false;
  stockMap: Record<string, number> = {};
  rejectionReason = '';
  rejectionError = '';
  processingAction = false;
  isWarehouseManager = false;

  readonly stepFlow: string[] = STEP_FLOW;
  readonly statuses: OrderStatus[] = ['CREATED', 'APPROVED', 'PACKED', 'DISPATCHED', 'DELIVERED', 'CANCELLED'];
  readonly Math = Math;

  packingOrder = false;

  get canApprove(): boolean {
    const role = (this.authService.role as string || '').toUpperCase();
    return role.includes('WAREHOUSE') || role.includes('ADMIN') || role === 'MANAGER';
  }

  get canPack(): boolean {
    const role = (this.authService.role as string || '').toUpperCase();
    return role.includes('DISTRIBUTION') || role.includes('DISPATCH') || role.includes('ADMIN') || role === 'MANAGER';
  }

  constructor(
    private orderService: OrderService,
    private inventoryService: InventoryService,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    const roleStr = (this.authService.role as string) || '';
    this.isWarehouseManager = roleStr.toUpperCase().includes('WAREHOUSE');

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

  // ── Warehouse Manager Approval & Inventory Stock Modal ────
  openApprovalModal(): void {
    if (!this.selected) return;
    this.showApprovalModal = true;
    this.rejectionReason   = '';
    this.rejectionError    = '';
    this.loadInventoryStock(this.selected.warehouseId);
  }

  closeApprovalModal(): void {
    this.showApprovalModal = false;
    this.rejectionReason   = '';
    this.rejectionError    = '';
  }

  loadInventoryStock(warehouseId: number | string): void {
    this.loadingStock = true;
    this.stockMap     = {};

    this.inventoryService.getInventory({ warehouseId: warehouseId || undefined, size: 1000 }).subscribe({
      next: (res) => {
        const invList = res.products || [];
        const map: Record<string, number> = {};
        invList.forEach((item: any) => {
          const pId = String(item.productId);
          const qty = item.availableQuantity ?? item.quantityAvailable ?? 0;
          map[pId] = (map[pId] || 0) + qty;
        });
        this.stockMap     = map;
        this.loadingStock = false;
      },
      error: () => {
        this.inventoryService.getAll().subscribe({
          next: (rows) => {
            const map: Record<string, number> = {};
            (rows || []).forEach(r => {
              if (!warehouseId || String(r.warehouseId) === String(warehouseId)) {
                const pId = String(r.productId);
                map[pId] = (map[pId] || 0) + (r.availableQty || 0);
              }
            });
            this.stockMap     = map;
            this.loadingStock = false;
          },
          error: () => {
            this.loadingStock = false;
          }
        });
      }
    });
  }

  getAvailableStock(productId: number | string): number {
    return this.stockMap[String(productId)] ?? 0;
  }

  getRemainingStock(productId: number | string, requestedQty: number): number {
    return this.getAvailableStock(productId) - (requestedQty || 0);
  }

  hasStockIssue(): boolean {
    if (!this.selected || !this.selected.items) return false;
    return this.selected.items.some(i => this.getRemainingStock(i.productId, i.quantity) < 0);
  }

  approveOrderModal(): void {
    if (!this.selected) return;
    this.processingAction = true;
    this.rejectionError   = '';

    this.orderService.approveOrder(this.selected.id).subscribe({
      next: (updated) => {
        this.processingAction = false;
        const updObj = updated || { ...this.selected!, status: 'APPROVED' };
        this.selectedOrder = updObj;
        const idx = this.orders.findIndex(o => o.id === updObj.id);
        if (idx !== -1) this.orders[idx] = updObj;
        this.showApprovalModal = false;
        this.loadHistory(updObj.id);
      },
      error: (err) => {
        this.rejectionError   = err?.message || 'Could not approve order.';
        this.processingAction = false;
      }
    });
  }

  rejectOrderModal(): void {
    if (!this.selected) return;
    if (!this.rejectionReason.trim()) {
      this.rejectionError = 'Please specify a rejection reason before confirming rejection.';
      return;
    }
    this.processingAction = true;
    this.rejectionError   = '';

    this.orderService.updateOrderStatus(this.selected.id, 'CANCELLED', this.rejectionReason.trim()).subscribe({
      next: (updated) => {
        this.processingAction = false;
        const updObj = updated || { ...this.selected!, status: 'CANCELLED' };
        this.selectedOrder = updObj;
        const idx = this.orders.findIndex(o => o.id === updObj.id);
        if (idx !== -1) this.orders[idx] = updObj;
        this.showApprovalModal = false;
        this.loadHistory(updObj.id);
      },
      error: (err) => {
        this.rejectionError   = err?.message || 'Could not reject order.';
        this.processingAction = false;
      }
    });
  }

  packOrder(): void {
    if (!this.selected) return;
    this.packingOrder = true;
    this.errorMsg     = '';

    this.orderService.updateOrderStatus(this.selected.id, 'PACKED', 'Order packed and prepared for shipment').subscribe({
      next: (updated) => {
        this.packingOrder = false;
        const updObj = updated || { ...this.selected!, status: 'PACKED' };
        this.selectedOrder = updObj;
        const idx = this.orders.findIndex(o => o.id === updObj.id);
        if (idx !== -1) this.orders[idx] = updObj;
        this.loadHistory(updObj.id);
      },
      error: (err) => {
        this.errorMsg     = err?.message || 'Could not update order status to PACKED.';
        this.packingOrder = false;
      }
    });
  }

  dispatchOrder(): void {
    if (!this.selected) return;
    this.router.navigate(['/shipments/new'], { queryParams: { orderId: this.selected.id } });
  }
}

