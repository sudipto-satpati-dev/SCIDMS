import { Component, OnInit } from '@angular/core';
import { OrderService } from '../../../core/services/order.service';
import { ProductService } from '../../../core/services/product.service';
import { Order, OrderStatus, Product } from '../../../core/models/index';

interface NewOrderItem {
  productId:   string;
  productName: string;
  unitPrice:   number;
  quantity:    number | null;
}

@Component({
  selector: 'app-order-list',
  templateUrl: './order-list.component.html',
  styleUrls: ['./order-list.component.scss']
})
export class OrderListComponent implements OnInit {

  orders: Order[]     = [];
  products: Product[] = [];
  loading = true;

  searchTerm      = '';
  filterStatus    = '';
  currentPage     = 1;
  pageSize        = 8;
  showCreateModal = false;
  createSuccess   = false;
  submitting      = false;
  formErrors: Record<string, string> = {};
  errorMsg = '';

  statuses: OrderStatus[] = ['Created', 'Approved', 'Rejected', 'Cancelled', 'Dispatched', 'Delivered'];

  newOrder = { customerName: '', contactNumber: '', address: '' };
  newItems: NewOrderItem[] = [{ productId: '', productName: '', unitPrice: 0, quantity: null }];

  constructor(
    private orderService: OrderService,
    private productService: ProductService,
  ) {}

  ngOnInit(): void {
    this.orderService.getAll().subscribe(data => { this.orders = data; this.loading = false; });
    this.productService.getAll().subscribe(data => { this.products = data.filter(p => p.status === 'Active'); });
  }

  // ── New order form ────────────────────────────────────────
  get orderTotal(): number {
    return this.newItems.reduce((sum, i) => sum + (i.unitPrice * (i.quantity || 0)), 0);
  }

  get totalQtyCount(): number {
    return this.newItems.reduce((sum, i) => sum + (i.quantity || 0), 0);
  }

  addItem(): void { this.newItems.push({ productId: '', productName: '', unitPrice: 0, quantity: null }); }

  removeItem(idx: number): void { if (this.newItems.length > 1) this.newItems.splice(idx, 1); }

  onProductSelect(idx: number): void {
    const pid  = this.newItems[idx].productId;
    const prod = this.products.find(p => p.id === pid);
    if (prod) {
      this.newItems[idx].productName = prod.name;
      this.newItems[idx].unitPrice   = prod.unitPrice;
    }
  }  openCreateModal(): void {
    this.newOrder      = { customerName: '', contactNumber: '', address: '' };
    this.newItems      = [{ productId: '', productName: '', unitPrice: 0, quantity: null }];
    this.formErrors    = {};
    this.createSuccess = false;
    this.errorMsg      = '';
    this.showCreateModal = true;
  }

  validateCreate(): boolean {
    const e: Record<string, string> = {};
    if (!this.newOrder.customerName.trim())  e['customerName']  = 'Customer name is required.';
    if (!this.newOrder.contactNumber.trim()) e['contactNumber'] = 'Contact number is required.';
    if (!this.newOrder.address.trim())       e['address']       = 'Address is required.';
    const validItems = this.newItems.filter(i => i.productId && i.quantity && i.quantity > 0);
    if (validItems.length === 0) e['items'] = 'At least one item with a positive quantity is required.';
    this.formErrors = e;
    return Object.keys(e).length === 0;
  }

  submitOrder(): void {
    if (!this.validateCreate()) return;
    this.submitting = true;
    this.errorMsg   = '';

    const validItems = this.newItems
      .filter(i => i.productId && i.quantity && i.quantity > 0)
      .map(i => ({ productId: i.productId, quantity: i.quantity! }));

    this.orderService.create({
      customerName:  this.newOrder.customerName,
      contactNumber: this.newOrder.contactNumber,
      address:       this.newOrder.address,
      items:         validItems,
    }).subscribe({
      next: (order) => {
        this.orders.unshift(order);
        this.createSuccess = true;
        this.submitting    = false;
        setTimeout(() => { this.showCreateModal = false; }, 1400);
      },
      error: (err) => {
        this.errorMsg   = err?.message || 'Could not create order.';
        this.submitting = false;
      },
    });
  }

  // ── Table helpers ─────────────────────────────────────────
  get filtered(): Order[] {
    return this.orders.filter(o => {
      const s = this.searchTerm.toLowerCase();
      const matchSearch = !s || o.id.toLowerCase().includes(s) || o.customerName.toLowerCase().includes(s);
      const matchStatus = !this.filterStatus || o.status === this.filterStatus;
      return matchSearch && matchStatus;
    });
  }

  get totalPages(): number  { return Math.ceil(this.filtered.length / this.pageSize) || 1; }
  get pageStart():  number  { return (this.currentPage - 1) * this.pageSize + 1; }
  get pageEnd():    number  { return Math.min(this.currentPage * this.pageSize, this.filtered.length); }
  get paged():      Order[] { return this.filtered.slice((this.currentPage - 1) * this.pageSize, this.currentPage * this.pageSize); }
  get pageNumbers(): number[] { return Array.from({ length: this.totalPages }, (_, i) => i + 1); }

  goToPage(p: number) { this.currentPage = p; }
  prevPage()          { if (this.currentPage > 1) this.currentPage--; }
  nextPage()          { if (this.currentPage < this.totalPages) this.currentPage++; }

  itemCount(o: Order):  number { return o.items.length; }
  totalItems(o: Order): number { return o.items.reduce((s, i) => s + i.quantity, 0); }
  orderValue(o: Order): number { return o.items.reduce((s, i) => s + i.unitPrice * i.quantity, 0); }

  get createdCount():    number { return this.orders.filter(o => o.status === 'Created').length; }
  get approvedCount():   number { return this.orders.filter(o => o.status === 'Approved').length; }
  get dispatchedCount(): number { return this.orders.filter(o => o.status === 'Dispatched' || o.status === 'Delivered').length; }

  statusClass(s: OrderStatus): string {
    const m: Record<OrderStatus, string> = {
      Created: 'pill-created', Approved: 'pill-approved', Packed: 'pill-packed',
      Rejected: 'pill-rejected', Cancelled: 'pill-cancelled',
      Dispatched: 'pill-dispatched', Delivered: 'pill-delivered',
    };
    return m[s];
  }

  fmt(n: number): string { return '৳ ' + n.toLocaleString('en-BD'); }
}
