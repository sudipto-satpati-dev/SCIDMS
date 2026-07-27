import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { InventoryService } from '../../../core/services/inventory.service';
import { WarehouseService } from '../../../core/services/warehouse.service';
import { ProductService } from '../../../core/services/product.service';
import { Warehouse, Product } from '../../../core/models/index';

@Component({
  selector: 'app-stock-receive',
  templateUrl: './stock-receive.component.html',
  styleUrls: ['./stock-receive.component.scss']
})
export class StockReceiveComponent implements OnInit {

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
  ) {
    this.form.date = this.todayStr();
  }

  ngOnInit(): void {
    this.warehouseService.getAll().subscribe(list => {
      this.warehouses = list.filter(w => w.status === 'Active');
    });
    this.productService.getAll().subscribe(list => {
      this.products = list.filter(p => p.status === 'Active');
    });
  }

  // ── Derived ──────────────────────────────────────────────
  get selectedWarehouse(): Warehouse | null {
    return this.warehouses.find(w => w.id === this.form.warehouseId) || null;
  }

  get selectedProduct(): Product | null {
    return this.products.find(p => p.id === this.form.productId) || null;
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
      p.id.toLowerCase().includes(s) ||
      p.sku.toLowerCase().includes(s)
    );
  }

  selectProduct(p: Product): void {
    this.form.productId      = p.id;
    this.productSearch       = `${p.name} (${p.sku})`;
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

    this.inventoryService.receiveStock({
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
    this.form         = { warehouseId: '', productId: '', quantity: null, reason: '', date: this.todayStr() };
    this.productSearch = '';
    this.formErrors   = {};
    this.submitted    = false;
    this.success      = false;
    this.errorMsg     = '';
  }

  cancel(): void { this.router.navigate(['/inventory']); }

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
