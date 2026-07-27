import { Component, OnInit } from '@angular/core';
import { InventoryService } from '../../../core/services/inventory.service';
import { InventoryTransaction, TransactionType } from '../../../core/models/index';

@Component({
  selector: 'app-inventory-history',
  templateUrl: './inventory-history.component.html',
  styleUrls: ['./inventory-history.component.scss']
})
export class InventoryHistoryComponent implements OnInit {

  transactions: InventoryTransaction[] = [];
  loading = true;

  searchProduct   = '';
  filterWarehouse = '';
  filterType      = '';
  filterDateFrom  = '';
  filterDateTo    = '';
  currentPage     = 1;
  pageSize        = 10;

  constructor(private inventoryService: InventoryService) {}

  ngOnInit(): void {
    this.inventoryService.getTransactions().subscribe(data => {
      this.transactions = data;
      this.loading = false;
    });
  }

  get warehouseNames(): string[] {
    return [...new Set(this.transactions.map(t => t.warehouseName))];
  }

  get filtered(): InventoryTransaction[] {
    return this.transactions.filter(t => {
      const s = this.searchProduct.toLowerCase();
      const matchProduct   = !s || t.productName.toLowerCase().includes(s) || t.productId.toLowerCase().includes(s);
      const matchWarehouse = !this.filterWarehouse || t.warehouseName === this.filterWarehouse;
      const matchType      = !this.filterType || t.type === this.filterType;
      return matchProduct && matchWarehouse && matchType;
    });
  }

  get totalPages(): number { return Math.ceil(this.filtered.length / this.pageSize) || 1; }
  get pageStart():  number { return (this.currentPage - 1) * this.pageSize + 1; }
  get pageEnd():    number { return Math.min(this.currentPage * this.pageSize, this.filtered.length); }
  get paged():      InventoryTransaction[] { return this.filtered.slice((this.currentPage - 1) * this.pageSize, this.currentPage * this.pageSize); }
  get pageNumbers(): number[] { return Array.from({ length: this.totalPages }, (_, i) => i + 1); }

  get receivedCount():    number { return this.transactions.filter(t => t.type === 'Received').length; }
  get dispatchedCount():  number { return this.transactions.filter(t => t.type === 'Dispatched').length; }
  get transferredCount(): number { return this.transactions.filter(t => t.type === 'Transferred').length; }

  clearFilters(): void {
    this.searchProduct  = '';
    this.filterWarehouse = '';
    this.filterType     = '';
    this.filterDateFrom = '';
    this.filterDateTo   = '';
    this.currentPage    = 1;
  }

  goToPage(p: number) { this.currentPage = p; }
  prevPage()          { if (this.currentPage > 1) this.currentPage--; }
  nextPage()          { if (this.currentPage < this.totalPages) this.currentPage++; }

  typeClass(type: TransactionType): string {
    return { Received: 'tag-received', Dispatched: 'tag-dispatched', Transferred: 'tag-transferred' }[type];
  }
  qtySign(type: TransactionType): string {
    return { Received: '+', Dispatched: '-', Transferred: '↔' }[type];
  }
  qtyClass(type: TransactionType): string {
    return { Received: 'qty-positive', Dispatched: 'qty-negative', Transferred: 'qty-transfer' }[type];
  }
}
