import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { InventoryService } from '../../../core/services/inventory.service';
import { WarehouseService } from '../../../core/services/warehouse.service';
import { Warehouse, InventoryRow } from '../../../core/models/index';

@Component({
  selector: 'app-stock-dispatch',
  templateUrl: './stock-dispatch.component.html',
  styleUrls: ['./stock-dispatch.component.scss']
})
export class StockDispatchComponent implements OnInit {

  warehouses: Warehouse[] = [];
  /** All inventory rows; filtered per selected warehouse in template */
  allInventory: InventoryRow[] = [];

  productSearch       = '';
  productDropdownOpen = false;
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

  constructor(
    private router: Router,
    private inventoryService: InventoryService,
    private warehouseService: WarehouseService,
  ) {
    this.form.date = this.todayStr();
  }

  ngOnInit(): void {
    this.warehouseService.getAll().subscribe(list => {
      this.warehouses = list.filter(w => w.status === 'Active');
    });
    this.inventoryService.getAll().subscribe(rows => {
      this.allInventory = rows;
    });
  }

  // ── Derived ──────────────────────────────────────────────
  get warehouseProducts(): InventoryRow[] {
    return this.allInventory.filter(r => r.warehouseId === this.form.warehouseId);
  }

  get selectedProduct(): InventoryRow | null {
    return this.warehouseProducts.find(p => p.productId === this.form.productId) || null;
  }

  get availableStock(): number { return this.selectedProduct?.availableQty ?? 0; }

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
    if (!this.selectedProduct || this.selectedProduct.availableQty === 0) return 0;
    const used = Math.min(this.form.quantity || 0, this.availableStock);
    return Math.round((used / this.availableStock) * 100);
  }

  get stockStatusClass(): 'ok' | 'low' | 'out' {
    if (!this.selectedProduct) return 'ok';
    if (this.selectedProduct.availableQty === 0) return 'out';
    if (this.selectedProduct.availableQty <= this.selectedProduct.threshold) return 'low';
    return 'ok';
  }

  // ── Product search dropdown ───────────────────────────────
  get filteredProducts(): InventoryRow[] {
    const s = this.productSearch.toLowerCase();
    return !s ? this.warehouseProducts
      : this.warehouseProducts.filter(p =>
          p.productName.toLowerCase().includes(s) ||
          p.productId.toLowerCase().includes(s) ||
          p.sku.toLowerCase().includes(s)
        );
  }

  selectProduct(p: InventoryRow): void {
    this.form.productId      = p.productId;
    this.productSearch       = `${p.productName} (${p.sku})`;
    this.productDropdownOpen = false;
    this.validateField('productId');
  }

  onWarehouseChange(): void {
    this.form.productId  = '';
    this.productSearch   = '';
    this.form.quantity   = null;
    this.formErrors      = {};
    this.productDropdownOpen = false;
  }

  onProductSearchFocus(): void { this.productDropdownOpen = true; }
  onProductSearchInput(): void { this.form.productId = ''; this.productDropdownOpen = true; }
  closeDropdown(): void { setTimeout(() => { this.productDropdownOpen = false; }, 180); }

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
    if (field === 'reason') e['reason'] = !this.form.reason.trim() ? 'Reason or reference is required.' : '';
    Object.keys(e).forEach(k => { if (!e[k]) delete e[k]; });
    this.formErrors = e;
  }

  submit(): void {
    ['warehouseId', 'productId', 'quantity', 'reason'].forEach(f => this.validateField(f));
    if (Object.keys(this.formErrors).length || this.exceedsStock) return;
    this.submitted = true;
    this.errorMsg  = '';

    this.inventoryService.dispatchStock({
      warehouseId: this.form.warehouseId,
      productId:   this.form.productId,
      quantity:    this.form.quantity!,
      reason:      this.form.reason,
      date:        this.form.date,
    }).subscribe({
      next: () => { this.success = true; },
      error: (err) => {
        this.errorMsg = err?.message || 'An error occurred. Please try again.';
        this.submitted = false;
      },
    });
  }

  reset(): void {
    this.form = { warehouseId: '', productId: '', quantity: null, reason: '', date: this.todayStr() };
    this.productSearch = '';
    this.formErrors    = {};
    this.submitted     = false;
    this.success       = false;
    this.errorMsg      = '';
    // Reload inventory to reflect updated stock
    this.inventoryService.getAll().subscribe(rows => { this.allInventory = rows; });
  }

  cancel(): void { this.router.navigate(['/inventory']); }

  getWarehouseName(id: string): string {
    return this.warehouses.find(w => w.id === id)?.name || id;
  }

  private todayStr(): string { return new Date().toISOString().split('T')[0]; }

  todayReadable(): string {
    return new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  }
}
