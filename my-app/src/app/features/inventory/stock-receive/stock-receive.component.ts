import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { Router } from '@angular/router';
import { InventoryService } from '../../../core/services/inventory.service';
import { WarehouseService } from '../../../core/services/warehouse.service';
import { ProductService } from '../../../core/services/product.service';
import { AuthService } from '../../../core/services/auth.service';
import { Warehouse, Product, ApiReceiveStockRequest } from '../../../core/models/index';

@Component({
  selector: 'app-stock-receive',
  templateUrl: './stock-receive.component.html',
  styleUrls: ['./stock-receive.component.scss']
})
export class StockReceiveComponent implements OnInit {

  @Input() isModal = false;
  @Output() closed = new EventEmitter<void>();
  @Output() stockReceived = new EventEmitter<void>();

  warehouses: Warehouse[] = [];
  products: Product[] = [];

  productSearch = '';
  productDropdownOpen = false;
  loading = false;

  form = {
    warehouseId: '',
    productId:   '',
    quantity:    null as number | null,
    reason:      '',
    date:        ''
  };

  formErrors: Record<string, string> = {};
  submitted = false;
  success   = false;
  errorMsg  = '';

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

    this.productService.getAll().subscribe(res => {
      const list = Array.isArray(res) ? res : res.products || [];
      this.products = list.filter(p => p.status === 'ACTIVE' || p.status === ('Active' as any));
    });
  }

  // ── Derived ──────────────────────────────────────────────
  get selectedWarehouse(): Warehouse | null {
    return this.warehouses.find(w => String(w.id) === String(this.form.warehouseId)) || null;
  }

  get selectedProduct(): Product | null {
    return this.products.find(p => String(p.id) === String(this.form.productId)) || null;
  }

  get availableCapacity(): number {
    return this.selectedWarehouse
      ? this.selectedWarehouse.totalCapacity - this.selectedWarehouse.occupiedCapacity
      : 0;
  }

  get projectedOccupied(): number {
    return this.selectedWarehouse
      ? this.selectedWarehouse.occupiedCapacity + (this.form.quantity || 0)
      : 0;
  }

  get capacityExceededBy(): number {
    const excess = (this.form.quantity || 0) - this.availableCapacity;
    return excess > 0 ? excess : 0;
  }

  get capacityOk(): boolean {
    return !!this.selectedWarehouse && (this.form.quantity || 0) <= this.availableCapacity;
  }

  get showCapacityCheck(): boolean {
    return !!this.selectedWarehouse && !!this.form.quantity && this.form.quantity > 0;
  }

  get capacityPct(): number {
    return this.selectedWarehouse
      ? Math.round((this.projectedOccupied / this.selectedWarehouse.totalCapacity) * 100)
      : 0;
  }

  // ── Product search dropdown ───────────────────────────────
  get filteredProducts(): Product[] {
    const s = this.productSearch.toLowerCase();
    return !s ? this.products : this.products.filter(p =>
      p.name.toLowerCase().includes(s) ||
      String(p.id).toLowerCase().includes(s) ||
      (p.sku && p.sku.toLowerCase().includes(s))
    );
  }

  selectProduct(p: Product): void {
    this.form.productId      = String(p.id);
    this.productSearch       = `${p.name}${p.sku ? ' (' + p.sku + ')' : ''}`;
    this.productDropdownOpen = false;
    this.validateField('productId');
  }

  onProductSearchFocus(): void { this.productDropdownOpen = true; }

  onProductSearchInput(): void {
    this.form.productId      = '';
    this.productDropdownOpen = true;
  }

  closeDropdown(): void {
    setTimeout(() => { this.productDropdownOpen = false; }, 180);
  }

  // ── Validation ────────────────────────────────────────────
  validateField(field: string): void {
    const e = { ...this.formErrors };
    if (field === 'warehouseId') e['warehouseId'] = !this.form.warehouseId ? 'Please select a warehouse.' : '';
    if (field === 'productId')   e['productId']   = !this.form.productId   ? 'Please select a product.'  : '';
    if (field === 'quantity')    e['quantity']     = (!this.form.quantity || this.form.quantity <= 0)
                                                      ? 'Quantity must be a positive number.' : '';
    Object.keys(e).forEach(k => { if (!e[k]) delete e[k]; });
    this.formErrors = e;
  }

  // ── Submit ────────────────────────────────────────────────
  submit(): void {
    ['warehouseId', 'productId', 'quantity'].forEach(f => this.validateField(f));
    if (Object.keys(this.formErrors).length) return;
    if (!this.capacityOk) return;

    this.submitted = true;
    this.errorMsg  = '';

    const refNum = this.form.reason.trim() || `REF-${Math.floor(100000 + Math.random() * 900000)}`;

    const req: ApiReceiveStockRequest = {
      warehouseId: this.form.warehouseId,
      productId:   this.form.productId,
      quantity:    this.form.quantity!,
      referenceNumber: refNum
    };

    this.inventoryService.receiveStockApi(req).subscribe({
      next: () => {
        this.success = true;
        this.stockReceived.emit();
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
    this.formErrors   = {};
    this.submitted    = false;
    this.success      = false;
    this.errorMsg     = '';
  }

  cancel(): void {
    if (this.isModal) {
      this.closed.emit();
    } else {
      this.router.navigate(['/inventory']);
    }
  }

  private todayStr(): string {
    return new Date().toISOString().split('T')[0];
  }

  todayReadable(): string {
    return new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  incomingBarWidth(w: Warehouse, qty: number): number {
    const availPct    = 100 - (w.occupiedCapacity / w.totalCapacity) * 100;
    const incomingPct = (qty / w.totalCapacity) * 100;
    return Math.min(incomingPct, availPct);
  }
}

