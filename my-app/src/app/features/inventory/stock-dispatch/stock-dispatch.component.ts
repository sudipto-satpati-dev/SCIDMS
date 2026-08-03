import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, catchError, takeUntil } from 'rxjs/operators';
import { InventoryService } from '../../../core/services/inventory.service';
import { WarehouseService } from '../../../core/services/warehouse.service';
import { ProductService } from '../../../core/services/product.service';
import { AuthService } from '../../../core/services/auth.service';
import { Warehouse, Product, ApiInventoryItem, ApiDispatchStockRequest } from '../../../core/models/index';

@Component({
  selector: 'app-stock-dispatch',
  templateUrl: './stock-dispatch.component.html',
  styleUrls: ['./stock-dispatch.component.scss']
})
export class StockDispatchComponent implements OnInit, OnDestroy {

  @Input() isModal = false;
  @Output() closed = new EventEmitter<void>();
  @Output() stockDispatched = new EventEmitter<void>();

  warehouses: Warehouse[] = [];
  inventoryItems: ApiInventoryItem[] = [];
  selectedItem: ApiInventoryItem | null = null;

  productSearch = '';
  productDropdownOpen = false;
  loading = false;
  loadingProducts = false;
  formErrors: Record<string, string> = {};
  submitted = false;
  success   = false;
  errorMsg  = '';

  form = {
    warehouseId: '',
    productId:   '',
    quantity:    null as number | null,
    reason:      '',
    date:        ''
  };

  private productSearchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private inventoryService: InventoryService,
    private warehouseService: WarehouseService,
    private productService: ProductService,
    private authService: AuthService
  ) {
    this.form.date = this.todayStr();
  }

  ngOnInit(): void {
    const role = this.authService.role;
    const isManager = role === 'WAREHOUSE_MANAGER' || role === 'Warehouse Manager';

    if (isManager) {
      this.warehouseService.getMyWarehouses().subscribe(list => {
        this.warehouses = (list || []).filter(w => w.status === 'ACTIVE' || w.status === ('Active' as any));
      });
    } else {
      this.warehouseService.getAll().subscribe(res => {
        const list = Array.isArray(res) ? res : res.warehouses || [];
        this.warehouses = list.filter(w => w.status === 'ACTIVE' || w.status === ('Active' as any));
      });
    }

    // Configure 1-second debounce for product search in dispatch
    this.productSearchSubject
      .pipe(
        debounceTime(1000),
        distinctUntilChanged(),
        switchMap(query => {
          this.loadingProducts = true;
          return this.inventoryService.getInventory({
            warehouseId: this.form.warehouseId || undefined,
            search: query ? query.trim() : undefined,
            page: 0,
            size: 20
          }).pipe(
            catchError(() => of({ products: [], page: 0, size: 20, totalElements: 0, totalPages: 0 }))
          );
        }),
        takeUntil(this.destroy$)
      )
      .subscribe(res => {
        this.loadingProducts = false;
        this.inventoryItems = res.products || [];
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Derived ──────────────────────────────────────────────
  get selectedWarehouse(): Warehouse | null {
    return this.warehouses.find(w => String(w.id) === String(this.form.warehouseId)) || null;
  }

  get selectedProduct(): ApiInventoryItem | null {
    return this.selectedItem || this.inventoryItems.find(i => String(i.productId) === String(this.form.productId)) || null;
  }

  get availableStock(): number {
    return this.selectedProduct?.availableQuantity ?? 0;
  }

  get exceedsStock(): boolean {
    return !!this.form.quantity && this.form.quantity > 0 && this.form.quantity > this.availableStock;
  }

  get exceedBy(): number {
    return this.exceedsStock ? (this.form.quantity! - this.availableStock) : 0;
  }

  get remainingAfter(): number {
    if (!this.form.quantity || this.form.quantity <= 0) return this.availableStock;
    return Math.max(0, this.availableStock - this.form.quantity);
  }

  get showStockCheck(): boolean {
    return !!this.selectedProduct && !!this.form.quantity && this.form.quantity > 0;
  }

  get stockBarPct(): number {
    if (!this.selectedProduct || this.availableStock === 0) return 0;
    const used = Math.min(this.form.quantity || 0, this.availableStock);
    return Math.round((used / this.availableStock) * 100);
  }

  get stockStatusClass(): 'ok' | 'low' | 'out' {
    if (!this.selectedProduct) return 'ok';
    if (this.selectedProduct.availableQuantity === 0) return 'out';
    if (this.selectedProduct.availableQuantity <= this.selectedProduct.lowStockThreshold) return 'low';
    return 'ok';
  }

  // ── Product search dropdown ───────────────────────────────
  selectProduct(item: ApiInventoryItem): void {
    this.selectedItem        = item;
    this.form.productId      = String(item.productId);
    this.productSearch       = item.productName;
    this.productDropdownOpen = false;
    this.validateField('productId');
  }

  onWarehouseChange(): void {
    this.form.productId      = '';
    this.productSearch       = '';
    this.selectedItem        = null;
    this.form.quantity       = null;
    this.formErrors          = {};
    this.productDropdownOpen = false;
    if (this.form.warehouseId) {
      this.productSearchSubject.next('');
    }
  }

  onProductSearchFocus(): void {
    this.productDropdownOpen = true;
    if (this.inventoryItems.length === 0 && this.form.warehouseId) {
      this.productSearchSubject.next(this.productSearch);
    }
  }

  onProductSearchInput(value: string): void {
    this.productSearch       = value;
    this.form.productId      = '';
    this.selectedItem        = null;
    this.productDropdownOpen = true;
    this.productSearchSubject.next(value);
  }

  closeDropdown(): void {
    setTimeout(() => { this.productDropdownOpen = false; }, 200);
  }

  // ── Validation ────────────────────────────────────────────
  validateField(field: string): void {
    const e = { ...this.formErrors };
    if (field === 'warehouseId') e['warehouseId'] = !this.form.warehouseId ? 'Please select a warehouse.' : '';
    if (field === 'productId')   e['productId']   = !this.form.productId   ? 'Please select a product.'  : '';
    if (field === 'quantity') {
      if (!this.form.quantity || this.form.quantity <= 0)
        e['quantity'] = 'Quantity must be a positive number.';
      else if (this.exceedsStock)
        e['quantity'] = `Quantity cannot exceed available stock (${this.availableStock} units).`;
      else e['quantity'] = '';
    }
    Object.keys(e).forEach(k => { if (!e[k]) delete e[k]; });
    this.formErrors = e;
  }

  submit(): void {
    ['warehouseId', 'productId', 'quantity'].forEach(f => this.validateField(f));
    if (Object.keys(this.formErrors).length || this.exceedsStock) return;

    this.submitted = true;
    this.errorMsg  = '';

    const refNum = this.form.reason.trim() || `REF-${Math.floor(100000 + Math.random() * 900000)}`;

    const req: ApiDispatchStockRequest = {
      warehouseId: this.form.warehouseId,
      productId:   this.form.productId,
      quantity:    this.form.quantity!,
      referenceNumber: refNum
    };

    this.inventoryService.dispatchStockApi(req).subscribe({
      next: () => {
        this.success = true;
        this.stockDispatched.emit();
        if (this.isModal) {
          setTimeout(() => {
            this.closed.emit();
          }, 1200);
        }
      },
      error: (err) => {
        this.errorMsg = err?.message || 'An error occurred. Please try again.';
        this.submitted = false;
      },
    });
  }

  reset(): void {
    this.form         = { warehouseId: '', productId: '', quantity: null, reason: '', date: this.todayStr() };
    this.productSearch = '';
    this.selectedItem  = null;
    this.formErrors    = {};
    this.submitted     = false;
    this.success       = false;
    this.errorMsg      = '';
  }

  cancel(): void {
    if (this.isModal) {
      this.closed.emit();
    } else {
      this.router.navigate(['/inventory']);
    }
  }

  getWarehouseName(id: string): string {
    return this.warehouses.find(w => String(w.id) === String(id))?.name || id;
  }

  private todayStr(): string { return new Date().toISOString().split('T')[0]; }

  todayReadable(): string {
    return new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  }
}

