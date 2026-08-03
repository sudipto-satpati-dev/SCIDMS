import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil, catchError } from 'rxjs/operators';
import { OrderService } from '../../../core/services/order.service';
import { ProductService } from '../../../core/services/product.service';
import { WarehouseService } from '../../../core/services/warehouse.service';
import { AuthService } from '../../../core/services/auth.service';
import { Order, OrderStatus, Product, ProductListParams, Warehouse, OrderListParams, CreateOrderRequest } from '../../../core/models/index';

interface NewOrderItem {
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number | null;
  productSearch?: string;
  dropdownOpen?: boolean;
}

@Component({
  selector: 'app-order-list',
  templateUrl: './order-list.component.html',
  styleUrls: ['./order-list.component.scss']
})
export class OrderListComponent implements OnInit, OnDestroy {

  orders: Order[] = [];
  products: Product[] = [];
  warehouses: Warehouse[] = [];
  loading = true;

  searchTerm = '';
  filterStatus = '';
  filterWarehouseId = '';
  currentPage = 1;
  pageSize = 10;
  totalElements = 0;
  totalPages = 1;

  isWarehouseManager = false;

  showCreateModal = false;
  createSuccess = false;
  submitting = false;
  formErrors: Record<string, string> = {};
  errorMsg = '';

  readonly statusOptions: { label: string; value: string }[] = [
    { label: 'All Statuses', value: '' },
    { label: 'Created', value: 'CREATED' },
    { label: 'Approved', value: 'APPROVED' },
    { label: 'Packed', value: 'PACKED' },
    { label: 'Dispatched', value: 'DISPATCHED' },
    { label: 'Delivered', value: 'DELIVERED' },
    { label: 'Cancelled', value: 'CANCELLED' }
  ];

  newOrder = {
    customerName: '',
    customerEmail: '',
    deliveryAddress: '',
    warehouseId: ''
  };
  newItems: NewOrderItem[] = [{ productId: '', productName: '', unitPrice: 0, quantity: 1 }];

  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  productSearchSubject = new Subject<string>();
  productSearchTerm = '';
  loadingProducts = false;

  constructor(
    private orderService: OrderService,
    private productService: ProductService,
    private warehouseService: WarehouseService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const roleStr = (this.authService.role as string) || '';
    this.isWarehouseManager = roleStr.toUpperCase().includes('WAREHOUSE');

    if (this.isWarehouseManager) {
      this.warehouseService.getMyWarehouses().subscribe(list => {
        this.warehouses = list || [];
      });
    } else {
      this.warehouseService.getAll().subscribe(res => {
        this.warehouses = Array.isArray(res) ? res : res.warehouses || [];
      });
    }

    // 1-second debounce for order search
    this.searchSubject
      .pipe(
        debounceTime(1000),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.currentPage = 1;
        this.loadOrders();
      });

    // 1-second debounce for modal product search
    this.productSearchSubject
      .pipe(
        debounceTime(1000),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe((searchTerm) => {
        this.loadModalProducts(searchTerm);
      });

    this.loadOrders();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadOrders(): void {
    this.loading = true;
    this.errorMsg = '';

    const params: OrderListParams = {
      search: this.searchTerm ? this.searchTerm.trim() : undefined,
      status: this.filterStatus || undefined,
      warehouseId: this.filterWarehouseId || undefined,
      page: this.currentPage - 1,
      size: this.pageSize,
      sort: 'createdAt,desc'
    };

    this.orderService.getOrders(params).subscribe({
      next: (res) => {
        this.orders        = res.orders || [];
        this.totalElements = res.totalElements || 0;
        this.totalPages    = res.totalPages || 1;
        this.loading       = false;
      },
      error: (err) => {
        this.errorMsg = err?.message || 'Could not load orders.';
        this.loading  = false;
      }
    });
  }

  onSearchInput(val: string): void {
    this.searchTerm = val;
    this.searchSubject.next(val);
  }

  onFilterChange(): void {
    this.currentPage = 1;
    this.loadOrders();
  }

  clearFilters(): void {
    this.searchTerm        = '';
    this.filterStatus      = '';
    this.filterWarehouseId = '';
    this.currentPage       = 1;
    this.loadOrders();
  }

  // ── New Order Modal ───────────────────────────────────────
  get orderTotal(): number {
    return this.newItems.reduce((sum, i) => sum + (i.unitPrice * (i.quantity || 0)), 0);
  }

  get totalQtyCount(): number {
    return this.newItems.reduce((sum, i) => sum + (i.quantity || 0), 0);
  }

  addItem(): void {
    this.newItems.push({ productId: '', productName: '', unitPrice: 0, quantity: 1, productSearch: '', dropdownOpen: false });
  }

  removeItem(idx: number): void {
    if (this.newItems.length > 1) {
      this.newItems.splice(idx, 1);
    }
  }

  onProductSearchFocus(idx: number): void {
    this.newItems[idx].dropdownOpen = true;
    if (this.products.length === 0) {
      this.productSearchSubject.next(this.newItems[idx].productSearch || '');
    }
  }

  onProductSearchInputRow(idx: number, val: string): void {
    this.newItems[idx].productSearch = val;
    this.newItems[idx].productId     = '';
    this.newItems[idx].productName   = '';
    this.newItems[idx].unitPrice     = 0;
    this.newItems[idx].dropdownOpen  = true;
    this.productSearchSubject.next(val);
  }

  selectProductRow(idx: number, p: Product): void {
    this.newItems[idx].productId     = String(p.id);
    this.newItems[idx].productName   = p.name;
    this.newItems[idx].unitPrice     = p.unitPrice || 0;
    this.newItems[idx].productSearch = `${p.name}${p.sku ? ' (SKU: ' + p.sku + ')' : ''}`;
    this.newItems[idx].dropdownOpen  = false;
  }

  closeProductDropdown(idx: number): void {
    setTimeout(() => {
      if (this.newItems[idx]) {
        this.newItems[idx].dropdownOpen = false;
      }
    }, 200);
  }

  loadModalProducts(search: string = ''): void {
    this.loadingProducts = true;
    const params: ProductListParams = {
      search: search ? search.trim() : undefined,
      status: 'ACTIVE',
      page: 0,
      size: 20
    };

    this.productService.getAll(params).subscribe({
      next: (res) => {
        const fetched = res.products || [];
        this.products = fetched;
        this.loadingProducts = false;
      },
      error: () => {
        this.loadingProducts = false;
      }
    });
  }

  openCreateModal(): void {
    this.newOrder = {
      customerName: '',
      customerEmail: '',
      deliveryAddress: '',
      warehouseId: this.warehouses.length > 0 ? String(this.warehouses[0].id) : ''
    };
    this.newItems          = [{ productId: '', productName: '', unitPrice: 0, quantity: 1, productSearch: '', dropdownOpen: false }];
    this.formErrors        = {};
    this.createSuccess     = false;
    this.errorMsg          = '';
    this.productSearchTerm = '';
    this.showCreateModal   = true;
    this.loadModalProducts('');
  }

  validateCreate(): boolean {
    const e: Record<string, string> = {};
    if (!this.newOrder.customerName.trim())    e['customerName']    = 'Customer name is required.';
    if (!this.newOrder.customerEmail.trim())   e['customerEmail']   = 'Customer email is required.';
    if (!this.newOrder.deliveryAddress.trim()) e['deliveryAddress'] = 'Delivery address is required.';
    if (!this.newOrder.warehouseId)            e['warehouseId']     = 'Please select a warehouse.';

    const validItems = this.newItems.filter(i => i.productId && i.quantity && i.quantity > 0);
    if (validItems.length === 0) {
      e['items'] = 'At least one product item with a positive quantity is required.';
    }
    this.formErrors = e;
    return Object.keys(e).length === 0;
  }

  submitOrder(): void {
    if (!this.validateCreate()) return;
    this.submitting = true;
    this.errorMsg   = '';

    const itemsPayload = this.newItems
      .filter(i => i.productId && i.quantity && i.quantity > 0)
      .map(i => ({ productId: i.productId, quantity: i.quantity! }));

    const req: CreateOrderRequest = {
      customerName:    this.newOrder.customerName.trim(),
      customerEmail:   this.newOrder.customerEmail.trim(),
      deliveryAddress: this.newOrder.deliveryAddress.trim(),
      warehouseId:     this.newOrder.warehouseId,
      items:           itemsPayload
    };

    this.orderService.createOrderApi(req).subscribe({
      next: () => {
        this.createSuccess = true;
        this.submitting    = false;
        this.loadOrders();
        setTimeout(() => { this.showCreateModal = false; }, 1200);
      },
      error: (err) => {
        this.errorMsg   = err?.message || 'Could not create order.';
        this.submitting = false;
      },
    });
  }

  // ── Pagination Controls ───────────────────────────────────
  goToPage(p: number): void {
    if (p >= 1 && p <= this.totalPages) {
      this.currentPage = p;
      this.loadOrders();
    }
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadOrders();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadOrders();
    }
  }

  get pageStart(): number {
    return this.totalElements === 0 ? 0 : (this.currentPage - 1) * this.pageSize + 1;
  }

  get pageEnd(): number {
    return Math.min(this.currentPage * this.pageSize, this.totalElements);
  }

  get pageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  statusClass(status: string): string {
    const s = (status || '').toUpperCase();
    if (s === 'CREATED') return 'pill-created';
    if (s === 'APPROVED') return 'pill-approved';
    if (s === 'PACKED') return 'pill-packed';
    if (s === 'DISPATCHED') return 'pill-dispatched';
    if (s === 'DELIVERED') return 'pill-delivered';
    if (s === 'CANCELLED' || s === 'REJECTED') return 'pill-cancelled';
    return 'pill-created';
  }

  itemCount(o: Order): number {
    return o.items ? o.items.length : 0;
  }

  totalUnits(o: Order): number {
    return o.items ? o.items.reduce((sum, i) => sum + (i.quantity || 0), 0) : 0;
  }

  fmt(n: number): string {
    return '$' + (n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
}

