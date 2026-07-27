import { Component, OnInit } from '@angular/core';
import { InventoryService } from '../../../core/services/inventory.service';
import { InventoryRow } from '../../../core/models/index';

@Component({
  selector: 'app-low-stock-alerts',
  templateUrl: './low-stock-alerts.component.html',
  styleUrls: ['./low-stock-alerts.component.scss']
})
export class LowStockAlertsComponent implements OnInit {

  alerts: InventoryRow[] = [];
  loading = true;
  searchTerm      = '';
  filterWarehouse = '';
  filterSeverity  = '';

  constructor(private inventoryService: InventoryService) {}

  ngOnInit(): void {
    this.inventoryService.getLowStock().subscribe(data => {
      this.alerts  = data;
      this.loading = false;
    });
  }

  severity(row: InventoryRow): 'out' | 'critical' | 'low' {
    if (row.availableQty === 0) return 'out';
    if (row.availableQty <= Math.ceil(row.threshold * 0.5)) return 'critical';
    return 'low';
  }

  get warehouseNames(): string[] {
    return [...new Set(this.alerts.map(r => r.warehouseName))];
  }

  get filtered(): InventoryRow[] {
    return this.alerts.filter(r => {
      const s = this.searchTerm.toLowerCase();
      const matchSearch = !s || r.productName.toLowerCase().includes(s) || r.productId.toLowerCase().includes(s);
      const matchWh   = !this.filterWarehouse || r.warehouseName === this.filterWarehouse;
      const matchSev  = !this.filterSeverity  || this.severity(r) === this.filterSeverity;
      return matchSearch && matchWh && matchSev;
    });
  }

  get outCount():      number { return this.alerts.filter(r => this.severity(r) === 'out').length; }
  get criticalCount(): number { return this.alerts.filter(r => this.severity(r) === 'critical').length; }
  get lowCount():      number { return this.alerts.filter(r => this.severity(r) === 'low').length; }

  severityClass(row: InventoryRow): string {
    const map = { out: 'sev-out', critical: 'sev-critical', low: 'sev-low' };
    return map[this.severity(row)];
  }

  pctRemaining(row: InventoryRow): number {
    return Math.round((row.availableQty / row.threshold) * 100);
  }
}
