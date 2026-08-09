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

  printInvoice(): void {
    if (!this.selected) return;

    const order = this.selected;
    const printWin = window.open('', '_blank', 'width=900,height=800');
    if (!printWin) {
      alert('Could not open print window. Please allow popups in your browser.');
      return;
    }

    const orderRef = order.orderNumber || order.id;
    const invoiceDate = new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
    const subtotal = this.orderTotal(order);
    const grandTotal = subtotal;

    const itemsHtml = (order.items || []).map((item, index) => `
      <tr>
        <td style="padding:10px 12px; border-bottom:1px solid #e2e8f0; text-align:center;">${index + 1}</td>
        <td style="padding:10px 12px; border-bottom:1px solid #e2e8f0; font-weight:600; color:#0f172a;">${item.productName}</td>
        <td style="padding:10px 12px; border-bottom:1px solid #e2e8f0; text-align:center;">${item.quantity}</td>
        <td style="padding:10px 12px; border-bottom:1px solid #e2e8f0; text-align:right;">${this.fmt(item.unitPrice)}</td>
        <td style="padding:10px 12px; border-bottom:1px solid #e2e8f0; text-align:right; font-weight:600;">${this.fmt(item.lineTotal || (item.unitPrice * item.quantity))}</td>
      </tr>
    `).join('');

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice - ${orderRef}</title>
          <style>
            @media print {
              body { margin: 0; padding: 20px; }
              @page { size: auto; margin: 15mm; }
            }
            body { font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0f172a; padding: 30px; margin: 0; background: #fff; }
            .invoice-container { max-width: 800px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; padding: 36px; box-sizing: border-box; }
            .header-bar { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0f172a; padding-bottom: 20px; margin-bottom: 24px; }
            .company-brand { display: flex; align-items: center; gap: 12px; }
            .logo-title { font-size: 24px; font-weight: 800; color: #0f172a; margin: 0; letter-spacing: -0.02em; }
            .logo-sub { font-size: 11px; color: #64748b; margin: 2px 0 0 0; text-transform: uppercase; letter-spacing: 0.05em; }
            .invoice-tag { text-align: right; }
            .inv-title { font-size: 28px; font-weight: 900; color: #2563eb; margin: 0; text-transform: uppercase; letter-spacing: 0.05em; }
            .inv-ref { font-size: 14px; font-weight: 700; color: #334155; margin-top: 4px; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 28px; background: #f8fafc; padding: 18px 20px; border-radius: 8px; border: 1px solid #f1f5f9; }
            .info-col-title { font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 6px; }
            .info-val { font-size: 13.5px; color: #1e293b; line-height: 1.5; }
            .info-val strong { color: #0f172a; }
            .status-badge { display: inline-block; padding: 3px 10px; border-radius: 4px; font-size: 11px; font-weight: 700; text-transform: uppercase; background: #dcfce7; color: #15803d; }
            .items-table { width: 100%; border-collapse: collapse; margin-bottom: 28px; font-size: 13.5px; }
            .items-table th { background: #0f172a; color: #ffffff; padding: 10px 12px; font-weight: 600; text-align: left; font-size: 12px; text-transform: uppercase; letter-spacing: 0.04em; }
            .total-card { margin-left: auto; width: 280px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 18px; margin-bottom: 30px; }
            .total-row { display: flex; justify-content: space-between; font-size: 13px; color: #475569; padding: 4px 0; }
            .total-row.grand { font-size: 16px; font-weight: 800; color: #0f172a; border-top: 1px solid #e2e8f0; margin-top: 6px; padding-top: 8px; }
            .terms-footer { font-size: 11px; color: #94a3b8; text-align: center; border-top: 1px dashed #cbd5e1; padding-top: 16px; }
          </style>
        </head>
        <body>
          <div class="invoice-container">
            <div class="header-bar">
              <div class="company-brand">
                <div>
                  <h1 class="logo-title">SCIDMS</h1>
                  <p class="logo-sub">Supply Chain Inventory &amp; Distribution</p>
                </div>
              </div>
              <div class="invoice-tag">
                <h2 class="inv-title">TAX INVOICE</h2>
                <div class="inv-ref">Ref: ${orderRef}</div>
                <div style="font-size:12px; color:#64748b; margin-top:2px;">Date: ${invoiceDate}</div>
              </div>
            </div>

            <div class="info-grid">
              <div>
                <div class="info-col-title">BILLED TO / CUSTOMER</div>
                <div class="info-val">
                  <strong>${order.customerName}</strong><br>
                  ${order.customerEmail ? order.customerEmail + '<br>' : ''}
                  ${order.contactNumber ? order.contactNumber + '<br>' : ''}
                  ${order.deliveryAddress || order.address || 'Standard Delivery Address'}
                </div>
              </div>
              <div>
                <div class="info-col-title">ORDER INFORMATION</div>
                <div class="info-val">
                  <strong>Order ID:</strong> ${orderRef}<br>
                  <strong>Status:</strong> <span class="status-badge">${order.status}</span><br>
                  ${order.warehouseName ? '<strong>Fulfillment Warehouse:</strong> ' + order.warehouseName + '<br>' : ''}
                  ${order.approvedBy ? '<strong>Approved By:</strong> ' + order.approvedBy + '<br>' : ''}
                </div>
              </div>
            </div>

            <table class="items-table">
              <thead>
                <tr>
                  <th style="width:40px; text-align:center;">#</th>
                  <th>Item &amp; Description</th>
                  <th style="width:70px; text-align:center;">Qty</th>
                  <th style="width:110px; text-align:right;">Unit Price</th>
                  <th style="width:120px; text-align:right;">Line Total</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>

            <div class="total-card">
              <div class="total-row">
                <span>Subtotal:</span>
                <span>${this.fmt(subtotal)}</span>
              </div>
              <div class="total-row">
                <span>Tax / VAT (0%):</span>
                <span>$0.00</span>
              </div>
              <div class="total-row grand">
                <span>Total Amount:</span>
                <span>${this.fmt(grandTotal)}</span>
              </div>
            </div>

            <div class="terms-footer">
              Thank you for choosing SCIDMS. This is an official computer-generated invoice.<br>
              SCIDMS Platform · Supply Chain &amp; Distribution Operations
            </div>
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
  }
}

