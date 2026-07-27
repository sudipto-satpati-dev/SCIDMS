import { Component, OnInit } from '@angular/core';
import { InventoryService } from '../../../core/services/inventory.service';
import { WarehouseService } from '../../../core/services/warehouse.service';
import { InventoryRow, Warehouse } from '../../../core/models/index';

@Component({
  selector: 'app-inventory-track',
  templateUrl: './inventory-track.component.html',
  styleUrls: ['./inventory-track.component.scss']
})
export class InventoryTrackComponent implements OnInit {

  rows: InventoryRow[]     = [];
  warehouses: Warehouse[]  = [];
  loading      = true;
  openNewEntry = false;

  searchTerm      = '';
  filterWarehouse = '';
  currentPage     = 1;
  pageSize        = 10;

  constructor(
    private inventoryService: InventoryService,
    private warehouseService: WarehouseService,
  ) {}

  ngOnInit(): void {
    this.warehouseService.getAll().subscribe(list => { this.warehouses = list; });
    this.inventoryService.getAll().subscribe(data => {
      this.rows    = data;
      this.loading = false;
    });
  }

  stockStatus(row: InventoryRow): 'out' | 'low' | 'in' {
    if (row.availableQty === 0) return 'out';
    if (row.availableQty <= row.threshold) return 'low';
    return 'in';
  }

  get warehouseNames(): string[] {
    return [...new Set(this.rows.map(r => r.warehouseName))];
  }

  get filtered(): InventoryRow[] {
    return this.rows.filter(r => {
      const s = this.searchTerm.toLowerCase();
      const matchSearch = !s ||
        r.productName.toLowerCase().includes(s) ||
        r.productId.toLowerCase().includes(s) ||
        r.sku.toLowerCase().includes(s);
      const matchWh = !this.filterWarehouse || r.warehouseName === this.filterWarehouse;
      return matchSearch && matchWh;
    });
  }

  get totalPages(): number { return Math.ceil(this.filtered.length / this.pageSize) || 1; }
  get pageStart():  number { return (this.currentPage - 1) * this.pageSize + 1; }
  get pageEnd():    number { return Math.min(this.currentPage * this.pageSize, this.filtered.length); }
  get paged():      InventoryRow[] { return this.filtered.slice((this.currentPage - 1) * this.pageSize, this.currentPage * this.pageSize); }
  get pageNumbers(): number[] { return Array.from({ length: this.totalPages }, (_, i) => i + 1); }

  get totalSKUs():       number { return new Set(this.rows.map(r => r.productId)).size; }
  get totalAvailable():  number { return this.rows.reduce((sum, r) => sum + r.availableQty, 0); }
  get lowStockCount():   number { return this.rows.filter(r => this.stockStatus(r) === 'low').length; }
  get outOfStockCount(): number { return this.rows.filter(r => this.stockStatus(r) === 'out').length; }

  goToPage(p: number) { this.currentPage = p; }
  prevPage()          { if (this.currentPage > 1) this.currentPage--; }
  nextPage()          { if (this.currentPage < this.totalPages) this.currentPage++; }

  // Trend chart data (mock KPI visualization — static, replace with real series data later)
  trendBars = [
    { inbound: 40, outbound: 28 }, { inbound: 55, outbound: 35 }, { inbound: 30, outbound: 22 },
    { inbound: 70, outbound: 50 }, { inbound: 45, outbound: 30 }, { inbound: 90, outbound: 65 },
    { inbound: 60, outbound: 42 }, { inbound: 38, outbound: 25 }, { inbound: 75, outbound: 55 },
    { inbound: 50, outbound: 38 }, { inbound: 85, outbound: 60 }, { inbound: 65, outbound: 45 },
    { inbound: 42, outbound: 30 }, { inbound: 78, outbound: 58 }, { inbound: 55, outbound: 40 },
  ];

  get capacityData(): { name: string; pct: number }[] {
    return this.warehouses.map(w => ({
      name: w.name,
      pct:  Math.round((w.occupiedCapacity / w.totalCapacity) * 100),
    }));
  }
}
