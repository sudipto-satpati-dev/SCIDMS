import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { InventoryService } from '../../../core/services/inventory.service';
import { WarehouseService } from '../../../core/services/warehouse.service';
import { ProductService } from '../../../core/services/product.service';
import { Warehouse, Product, InventoryRow } from '../../../core/models/index';

@Component({
  selector: 'app-stock-transfer',
  templateUrl: './stock-transfer.component.html',
  styleUrls: ['./stock-transfer.component.scss']
})
export class StockTransferComponent implements OnInit {

  warehouses: Warehouse[]   = [];
  products: Product[]       = [];
  allInventory: InventoryRow[] = [];

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

  constructor(
    private router: Router,
    private inventoryService: InventoryService,
    private warehouseService: WarehouseService,
    private productService: ProductService,
  ) {}

  ngOnInit(): void {
    this.warehouseService.getAll().subscribe(list => {
      this.warehouses = list.filter(w => w.status === 'Active');
    });
    this.productService.getAll().subscribe(list => {
      this.products = list.filter(p => p.status === 'Active');
    });
    this.inventoryService.getAll().subscribe(rows => {
      this.allInventory = rows;
    });
  }

  // ── Derived ──────────────────────────────────────────────
  get sourceWarehouse():      Warehouse | null { return this.warehouses.find(w => w.id === this.form.sourceId)      || null; }
  get destinationWarehouse(): Warehouse | null { return this.warehouses.find(w => w.id === this.form.destinationId) || null; }
  get selectedProduct():      Product   | null { return this.products.find(p => p.id === this.form.productId)       || null; }

  get destinationWarehouses(): Warehouse[] {
    return this.warehouses.filter(w => w.id !== this.form.sourceId);
  }

  get sourceAvailable(): number {
    if (!this.form.sourceId || !this.form.productId) return 0;
    return this.allInventory.find(
      r => r.warehouseId === this.form.sourceId && r.productId === this.form.productId
    )?.availableQty ?? 0;
  }

  get destCurrentStock(): number {
    if (!this.form.destinationId || !this.form.productId) return 0;
    return this.allInventory.find(
      r => r.warehouseId === this.form.destinationId && r.productId === this.form.productId
    )?.availableQty ?? 0;
  }

  get destAvailableCapacity(): number {
    const w = this.destinationWarehouse;
    return w ? w.totalCapacity - w.occupiedCapacity : 0;
  }

  get qty(): number { return this.form.quantity || 0; }

  get sourceAfter():        number  { return Math.max(0, this.sourceAvailable - this.qty); }
  get destStockAfter():     number  { return this.destCurrentStock + this.qty; }
  get destCapacityAfter():  number  { return Math.max(0, this.destAvailableCapacity - this.qty); }
  get sameWarehouse():      boolean { return !!this.form.sourceId && this.form.sourceId === this.form.destinationId; }
  get exceedsStock():       boolean { return this.qty > 0 && this.qty > this.sourceAvailable; }
  get exceedsCapacity():    boolean { return this.qty > 0 && this.qty > this.destAvailableCapacity; }
  get showPreview():        boolean { return !!this.form.sourceId && !!this.form.destinationId && !this.sameWarehouse; }

  get sourcePctUsed(): number {
    const w = this.sourceWarehouse;
    return w ? Math.round((w.occupiedCapacity / w.totalCapacity) * 100) : 0;
  }
  get destPctUsed(): number {
    const w = this.destinationWarehouse;
    return w ? Math.round((w.occupiedCapacity / w.totalCapacity) * 100) : 0;
  }
  get destPctAfter(): number {
    const w = this.destinationWarehouse;
    if (!w) return 0;
    return Math.min(100, Math.round(((w.occupiedCapacity + this.qty) / w.totalCapacity) * 100));
  }

  destCapacityBarColor(): string {
    const p = this.destPctAfter;
    if (p > 90) return 'bar-critical';
    if (p >= 70) return 'bar-warning';
    return 'bar-ok';
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

  onSourceChange(): void {
    this.form.productId  = '';
    this.form.quantity   = null;
    this.formErrors      = {};
    if (this.form.destinationId === this.form.sourceId) this.form.destinationId = '';
  }

  onDestChange(): void {
    this.validateField('destinationId');
    this.form.quantity = null;
  }

  submit(): void {
    ['sourceId', 'destinationId', 'productId', 'quantity'].forEach(f => this.validateField(f));
    if (Object.keys(this.formErrors).length || this.sameWarehouse || this.exceedsStock || this.exceedsCapacity) return;
    this.submitted = true;
    this.errorMsg  = '';

    this.inventoryService.transferStock({
      sourceWarehouseId:      this.form.sourceId,
      destinationWarehouseId: this.form.destinationId,
      productId:              this.form.productId,
      quantity:               this.form.quantity!,
      reason:                 this.form.reason,
    }).subscribe({
      next: () => { this.success = true; },
      error: (err) => {
        this.errorMsg = err?.message || 'Transfer could not be completed. Please try again.';
        this.submitted = false;
      },
    });
  }

  reset(): void {
    this.form       = { sourceId: '', destinationId: '', productId: '', quantity: null, reason: '' };
    this.formErrors = {};
    this.submitted  = false;
    this.success    = false;
    this.errorMsg   = '';
    // Reload inventory so the next transfer sees updated stock levels
    this.inventoryService.getAll().subscribe(rows => { this.allInventory = rows; });
    this.warehouseService.getAll().subscribe(list => { this.warehouses = list.filter(w => w.status === 'Active'); });
  }

  cancel(): void { this.router.navigate(['/inventory']); }
}
