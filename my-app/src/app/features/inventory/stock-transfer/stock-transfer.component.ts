import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, catchError, takeUntil } from 'rxjs/operators';
import { InventoryService } from '../../../core/services/inventory.service';
import { WarehouseService } from '../../../core/services/warehouse.service';
import { AuthService } from '../../../core/services/auth.service';
import { Warehouse, ApiInventoryItem, ApiTransferStockRequest } from '../../../core/models/index';

@Component({
  selector: 'app-stock-transfer',
  templateUrl: './stock-transfer.component.html',
  styleUrls: ['./stock-transfer.component.scss']
})
export class StockTransferComponent implements OnInit, OnDestroy {

  @Input() isModal = false;
  @Output() closed = new EventEmitter<void>();
  @Output() stockTransferred = new EventEmitter<void>();

  sourceWarehouses: Warehouse[] = [];
  allWarehouses: Warehouse[]    = [];
  inventoryItems: ApiInventoryItem[] = [];
  selectedItem: ApiInventoryItem | null = null;

  productSearch = '';
  productDropdownOpen = false;
  loadingProducts = false;

  form = {
    sourceId:      '',
    destinationId: '',
    productId:     '',
    quantity:      null as number | null,
    reason:        ''
  };

  formErrors: Record<string, string> = {};
  submitted = false;
  success   = false;
  errorMsg  = '';

  private productSearchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private inventoryService: InventoryService,
    private warehouseService: WarehouseService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const role = this.authService.role;
    const isManager = role === 'WAREHOUSE_MANAGER' || role === 'Warehouse Manager';

    // Fetch all active warehouses for destination selection
    this.warehouseService.getAll().subscribe(res => {
      const list = Array.isArray(res) ? res : res.warehouses || [];
      this.allWarehouses = list.filter(w => w.status === 'ACTIVE' || w.status === ('Active' as any));
      if (!isManager) {
        this.sourceWarehouses = this.allWarehouses;
      }
    });

    if (isManager) {
      this.warehouseService.getMyWarehouses().subscribe(list => {
        this.sourceWarehouses = (list || []).filter(w => w.status === 'ACTIVE' || w.status === ('Active' as any));
      });
    }

    // Configure 1s debounced product search in source warehouse
    this.productSearchSubject
      .pipe(
        debounceTime(1000),
        distinctUntilChanged(),
        switchMap(query => {
          this.loadingProducts = true;
          return this.inventoryService.getInventory({
            warehouseId: this.form.sourceId || undefined,
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
  get sourceWarehouse(): Warehouse | null {
    return this.sourceWarehouses.find(w => String(w.id) === String(this.form.sourceId)) ||
           this.allWarehouses.find(w => String(w.id) === String(this.form.sourceId)) || null;
  }

  get destinationWarehouse(): Warehouse | null {
    return this.allWarehouses.find(w => String(w.id) === String(this.form.destinationId)) || null;
  }

  get selectedProduct(): ApiInventoryItem | null {
    return this.selectedItem || this.inventoryItems.find(i => String(i.productId) === String(this.form.productId)) || null;
  }

  get destinationWarehouses(): Warehouse[] {
    return this.allWarehouses.filter(w => String(w.id) !== String(this.form.sourceId));
  }

  get sourceAvailable(): number {
    return this.selectedProduct?.availableQuantity ?? 0;
  }

  get destAvailableCapacity(): number {
    const w = this.destinationWarehouse;
    return w ? (w.totalCapacity - w.occupiedCapacity) : 0;
  }

  get qty(): number { return this.form.quantity || 0; }

  get sourceAfter():        number  { return Math.max(0, this.sourceAvailable - this.qty); }
  get destCapacityAfter():  number  { return Math.max(0, this.destAvailableCapacity - this.qty); }
  get sameWarehouse():      boolean { return !!this.form.sourceId && String(this.form.sourceId) === String(this.form.destinationId); }
  get exceedsStock():       boolean { return this.qty > 0 && this.qty > this.sourceAvailable; }
  get exceedsCapacity():    boolean { return this.qty > 0 && this.qty > this.destAvailableCapacity; }
  get showPreview():        boolean { return !!this.form.sourceId && !!this.form.destinationId && !this.sameWarehouse; }

  get destPctUsed(): number {
    const w = this.destinationWarehouse;
    return (w && w.totalCapacity) ? Math.round((w.occupiedCapacity / w.totalCapacity) * 100) : 0;
  }

  get destPctAfter(): number {
    const w = this.destinationWarehouse;
    if (!w || !w.totalCapacity) return 0;
    return Math.min(100, Math.round(((w.occupiedCapacity + this.qty) / w.totalCapacity) * 100));
  }

  // ── Product Search Dropdown ───────────────────────────────
  selectProduct(item: ApiInventoryItem): void {
    this.selectedItem        = item;
    this.form.productId      = String(item.productId);
    this.productSearch       = item.productName;
    this.productDropdownOpen = false;
    this.validateField('productId');
  }

  onSourceChange(): void {
    this.form.productId      = '';
    this.productSearch       = '';
    this.selectedItem        = null;
    this.form.quantity       = null;
    this.formErrors          = {};
    this.productDropdownOpen = false;
    if (this.form.destinationId === this.form.sourceId) this.form.destinationId = '';
    if (this.form.sourceId) {
      this.productSearchSubject.next('');
    }
  }

  onDestChange(): void {
    this.validateField('destinationId');
  }

  onProductSearchFocus(): void {
    this.productDropdownOpen = true;
    if (this.inventoryItems.length === 0 && this.form.sourceId) {
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
    if (field === 'sourceId')      e['sourceId']      = !this.form.sourceId ? 'Please select a source warehouse.' : '';
    if (field === 'destinationId') {
      if (!this.form.destinationId)  e['destinationId'] = 'Please select a destination warehouse.';
      else if (this.sameWarehouse)   e['destinationId'] = 'Source and destination must be different.';
      else                           e['destinationId'] = '';
    }
    if (field === 'productId')     e['productId']     = !this.form.productId ? 'Please select a product.' : '';
    if (field === 'quantity') {
      if (!this.form.quantity || this.form.quantity <= 0)
        e['quantity'] = 'Transfer quantity must be a positive number.';
      else if (this.exceedsStock)
        e['quantity'] = `Exceeds available stock in source (${this.sourceAvailable} units).`;
      else if (this.exceedsCapacity)
        e['quantity'] = `Exceeds available capacity in destination (${this.destAvailableCapacity} units).`;
      else e['quantity'] = '';
    }
    Object.keys(e).forEach(k => { if (!e[k]) delete e[k]; });
    this.formErrors = e;
  }

  submit(): void {
    ['sourceId', 'destinationId', 'productId', 'quantity'].forEach(f => this.validateField(f));
    if (Object.keys(this.formErrors).length || this.sameWarehouse || this.exceedsStock || this.exceedsCapacity) return;

    this.submitted = true;
    this.errorMsg  = '';

    const refNum = this.form.reason.trim() || `REF-${Math.floor(100000 + Math.random() * 900000)}`;

    const req: ApiTransferStockRequest = {
      sourceWarehouseId:      this.form.sourceId,
      destinationWarehouseId: this.form.destinationId,
      productId:              this.form.productId,
      quantity:               this.form.quantity!,
      referenceNumber:        refNum
    };

    this.inventoryService.transferStockApi(req).subscribe({
      next: () => {
        this.success = true;
        this.stockTransferred.emit();
        if (this.isModal) {
          setTimeout(() => {
            this.closed.emit();
          }, 1200);
        }
      },
      error: (err) => {
        this.errorMsg  = err?.message || 'Transfer could not be completed. Please try again.';
        this.submitted = false;
      },
    });
  }

  reset(): void {
    this.form          = { sourceId: '', destinationId: '', productId: '', quantity: null, reason: '' };
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
    return this.allWarehouses.find(w => String(w.id) === String(id))?.name || id;
  }
}

