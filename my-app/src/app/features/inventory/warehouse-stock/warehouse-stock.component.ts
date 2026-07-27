import { Component, OnInit } from '@angular/core';
import { InventoryService } from '../../../core/services/inventory.service';
import { WarehouseService } from '../../../core/services/warehouse.service';
import { InventoryRow, Warehouse } from '../../../core/models/index';

@Component({
  selector: 'app-warehouse-stock',
  templateUrl: './warehouse-stock.component.html',
  styleUrls: ['./warehouse-stock.component.scss']
})
export class WarehouseStockComponent implements OnInit {

  warehouses: Warehouse[]  = [];
  allInventory: InventoryRow[] = [];
  loading = true;

  selectedWarehouseId = '';
  searchTerm   = '';
  filterStatus = '';
  currentPage  = 1;
  pageSize     = 8;

  constructor(
    private inventoryService: InventoryService,
    private warehouseService: WarehouseService,
  ) {}

  ngOnInit(): void {
    this.warehouseService.getAll().subscribe(list => {
      this.warehouses = list.filter(w => w.status === 'Active');
      if (this.warehouses.length) this.selectedWarehouseId = this.warehouses[0].id;
    });
    this.inventoryService.getAll().subscribe(rows => {
      this.allInventory = rows;
      this.loading = false;
    });
  }

  get selectedWarehouse(): Warehouse | null {
    return this.warehouses.find(w => w.id === this.selectedWarehouseId) || null;
  }

  get allRows(): InventoryRow[] {
    return this.allInventory.filter(r => r.warehouseId === this.selectedWarehouseId);
  }

  stockStatus(r: InventoryRow): 'out' | 'low' | 'in' {
    if (r.availableQty === 0) return 'out';
    if (r.availableQty <= r.threshold) return 'low';
    return 'in';
  }

  get filtered(): InventoryRow[] {
    return this.allRows.filter(r => {
      const s = this.searchTerm.toLowerCase();
      const matchSearch = !s || r.productName.toLowerCase().includes(s) || r.productId.toLowerCase().includes(s);
      const status = this.stockStatus(r);
      const matchStatus = !this.filterStatus
        || (this.filterStatus === 'in'  && status === 'in')
        || (this.filterStatus === 'low' && status === 'low')
        || (this.filterStatus === 'out' && status === 'out');
      return matchSearch && matchStatus;
    });
  }

  get totalPages(): number    { return Math.ceil(this.filtered.length / this.pageSize) || 1; }
  get pageStart():  number    { return (this.currentPage - 1) * this.pageSize + 1; }
  get pageEnd():    number    { return Math.min(this.currentPage * this.pageSize, this.filtered.length); }
  get paged():      InventoryRow[] { return this.filtered.slice((this.currentPage - 1) * this.pageSize, this.currentPage * this.pageSize); }
  get pageNumbers(): number[] { return Array.from({ length: this.totalPages }, (_, i) => i + 1); }

  get totalProducts():  number { return this.allRows.length; }
  get totalUnits():     number { return this.allRows.reduce((s, r) => s + r.availableQty, 0); }
  get occupiedPct():    number {
    const w = this.selectedWarehouse;
    return w ? Math.round((w.occupiedCapacity / w.totalCapacity) * 100) : 0;
  }
  get lowStockCount():   number { return this.allRows.filter(r => this.stockStatus(r) === 'low').length; }
  get outOfStockCount(): number { return this.allRows.filter(r => this.stockStatus(r) === 'out').length; }

  onWarehouseChange(): void { this.currentPage = 1; this.searchTerm = ''; this.filterStatus = ''; }
  goToPage(p: number) { this.currentPage = p; }
  prevPage()          { if (this.currentPage > 1) this.currentPage--; }
  nextPage()          { if (this.currentPage < this.totalPages) this.currentPage++; }

  capacityColor(): string {
    if (this.occupiedPct > 90) return 'cap-critical';
    if (this.occupiedPct >= 70) return 'cap-warning';
    return 'cap-ok';
  }
}
