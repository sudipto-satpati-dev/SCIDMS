import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, catchError, takeUntil } from 'rxjs/operators';
import { OrderService } from '../../../core/services/order.service';
import { WarehouseService } from '../../../core/services/warehouse.service';
import { ProductService } from '../../../core/services/product.service';
import { AuthService } from '../../../core/services/auth.service';
import { Warehouse, Product, CreateOrderRequest, ProductListParams } from '../../../core/models/index';

interface OrderItemRow {
  productId: number | string;
  productName: string;
  unitPrice: number;
  quantity: number | null;
  productSearch: string;
  dropdownOpen: boolean;
}

@Component({
  selector: 'app-order-create',
  templateUrl: './order-create.component.html',
  styleUrls: ['./order-create.component.scss']
})
export class OrderCreateComponent implements OnInit, OnDestroy {

  warehouses: Warehouse[] = [];
  products: Product[] = [];

  newOrder = {
    customerName: '',
    customerEmail: '',
    deliveryAddress: '',
    warehouseId: '' as number | string
  };

  newItems: OrderItemRow[] = [
    { productId: '', productName: '', unitPrice: 0, quantity: 1, productSearch: '', dropdownOpen: false }
  ];

  formErrors: Record<string, string> = {};
  loadingProducts = false;
  submitting = false;
  success = false;
  errorMsg = '';

  private productSearchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private orderService: OrderService,
    private warehouseService: WarehouseService,
    private productService: ProductService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const role = this.authService.role;
    const isWarehouseManager = role === 'WAREHOUSE_MANAGER' || role === 'Warehouse Manager';

    if (isWarehouseManager) {
      this.warehouseService.getMyWarehouses().subscribe(list => {
        this.warehouses = (list || []).filter(w => w.status === 'ACTIVE' || w.status === ('Active' as any));
        if (this.warehouses.length > 0 && !this.newOrder.warehouseId) {
          this.newOrder.warehouseId = this.warehouses[0].id;
        }
      });
    } else {
      this.warehouseService.getAll().subscribe(res => {
        const list = Array.isArray(res) ? res : res.warehouses || [];
        this.warehouses = list.filter(w => w.status === 'ACTIVE' || w.status === ('Active' as any));
        if (this.warehouses.length > 0 && !this.newOrder.warehouseId) {
          this.newOrder.warehouseId = this.warehouses[0].id;
        }
      });
    }

    // Configure 1-second debounce for product search query
    this.productSearchSubject
      .pipe(
        debounceTime(1000),
        distinctUntilChanged(),
        switchMap(query => {
          this.loadingProducts = true;
          const params: ProductListParams = {
            search: query ? query.trim() : undefined,
            status: 'ACTIVE',
            page: 0,
            size: 20
          };
          return this.productService.getAll(params).pipe(
            catchError(() => of({ products: [], page: 0, size: 20, totalElements: 0, totalPages: 0 }))
          );
        }),
        takeUntil(this.destroy$)
      )
      .subscribe(res => {
        this.loadingProducts = false;
        const fetched = Array.isArray(res) ? res : res.products || [];
        this.products = fetched.filter(p => p.status === 'ACTIVE' || p.status === ('Active' as any));
      });

    // Trigger initial product fetch for dropdown options
    this.productSearchSubject.next('');
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

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
    this.newItems[idx].productId     = typeof p.id === 'number' ? p.id : (Number(p.id) || p.id);
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

  fmt(n: number): string {
    return '$' + (n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  validateCreate(): boolean {
    const e: Record<string, string> = {};
    if (!this.newOrder.customerName.trim())    e['customerName']    = 'Customer name is required.';
    if (!this.newOrder.customerEmail.trim())   e['customerEmail']   = 'Customer email is required.';
    if (!this.newOrder.deliveryAddress.trim()) e['deliveryAddress'] = 'Delivery address is required.';
    if (!this.newOrder.warehouseId)            e['warehouseId']     = 'Please select a warehouse.';

    const validItems = this.newItems.filter(i => (i.productId !== '' && i.productId !== null && i.productId !== undefined) && i.quantity && i.quantity > 0);
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
      .filter(i => (i.productId !== '' && i.productId !== null && i.productId !== undefined) && i.quantity && i.quantity > 0)
      .map(i => ({
        productId: typeof i.productId === 'number' ? i.productId : (Number(i.productId) || i.productId),
        quantity: i.quantity!
      }));

    const targetWarehouseId = typeof this.newOrder.warehouseId === 'number'
      ? this.newOrder.warehouseId
      : (Number(this.newOrder.warehouseId) || this.newOrder.warehouseId);

    const req: CreateOrderRequest = {
      customerName:    this.newOrder.customerName.trim(),
      customerEmail:   this.newOrder.customerEmail.trim(),
      deliveryAddress: this.newOrder.deliveryAddress.trim(),
      warehouseId:     targetWarehouseId,
      items:           itemsPayload
    };

    this.orderService.createOrderApi(req).subscribe({
      next: () => {
        this.submitting = false;
        this.success    = true;
        setTimeout(() => {
          this.router.navigate(['/orders']);
        }, 1200);
      },
      error: (err) => {
        this.errorMsg   = err?.message || 'Could not create customer order.';
        this.submitting = false;
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/orders']);
  }
}
