import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { InventoryService } from '../../../core/services/inventory.service';
import { WarehouseService } from '../../../core/services/warehouse.service';
import { AuthService } from '../../../core/services/auth.service';
import { ApiInventoryTransaction, Warehouse, TransactionHistoryParams } from '../../../core/models/index';

@Component({
  selector: 'app-inventory-history',
  templateUrl: './inventory-history.component.html',
  styleUrls: ['./inventory-history.component.scss']
})
export class InventoryHistoryComponent implements OnInit, OnDestroy {

  transactions: ApiInventoryTransaction[] = [];
  warehouses: Warehouse[] = [];
  loading = true;
  errorMsg = '';

  searchProduct = '';
  filterWarehouseId = '';
  filterType = ''; // RECEIVE, ALLOCATE, RELEASE ALLOCATION, DISPATCH, TRANSFER_OUT, TRANSFER_IN
  currentPage = 1;
  pageSize = 10;
  totalElements = 0;
  totalPages = 1;

  isWarehouseManager = false;

  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  readonly transactionTypes = [
    { label: 'All Types', value: '' },
    { label: 'Receive', value: 'RECEIVE' },
    { label: 'Allocate', value: 'ALLOCATE' },
    { label: 'Release Allocation', value: 'RELEASE ALLOCATION' },
    { label: 'Dispatch', value: 'DISPATCH' },
    { label: 'Transfer Out', value: 'TRANSFER_OUT' },
    { label: 'Transfer In', value: 'TRANSFER_IN' }
  ];

  constructor(
    private inventoryService: InventoryService,
    private warehouseService: WarehouseService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const role = this.authService.role;
    this.isWarehouseManager = role === 'WAREHOUSE_MANAGER' || role === 'Warehouse Manager';

    if (this.isWarehouseManager) {
      this.warehouseService.getMyWarehouses().subscribe(list => {
        this.warehouses = list || [];
      });
    } else {
      this.warehouseService.getAll().subscribe(res => {
        this.warehouses = Array.isArray(res) ? res : res.warehouses || [];
      });
    }

    // 1-second debounce for product search
    this.searchSubject
      .pipe(
        debounceTime(1000),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.currentPage = 1;
        this.loadHistory();
      });

    this.loadHistory();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadHistory(): void {
    this.loading = true;
    this.errorMsg = '';

    const params: TransactionHistoryParams = {
      productId: this.searchProduct ? this.searchProduct.trim() : undefined,
      warehouseId: this.filterWarehouseId || undefined,
      transactionType: this.filterType || undefined,
      page: this.currentPage - 1,
      size: this.pageSize,
      sort: 'transactionDate,desc'
    };

    this.inventoryService.getTransactionHistory(params).subscribe({
      next: (res) => {
        this.transactions  = res.transactions || [];
        this.totalElements = res.totalElements || 0;
        this.totalPages    = res.totalPages || 1;
        this.loading       = false;
      },
      error: (err) => {
        this.errorMsg = err?.message || 'Could not load transaction history.';
        this.loading  = false;
      }
    });
  }

  onSearchInput(val: string): void {
    this.searchProduct = val;
    this.searchSubject.next(val);
  }

  onFilterChange(): void {
    this.currentPage = 1;
    this.loadHistory();
  }

  clearFilters(): void {
    this.searchProduct     = '';
    this.filterWarehouseId = '';
    this.filterType        = '';
    this.currentPage       = 1;
    this.loadHistory();
  }

  goToPage(p: number): void {
    if (p >= 1 && p <= this.totalPages) {
      this.currentPage = p;
      this.loadHistory();
    }
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadHistory();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadHistory();
    }
  }

  get pageStart(): number {
    return this.totalElements === 0 ? 0 : (this.currentPage - 1) * this.pageSize + 1;
  }

  get pageEnd(): number {
    return Math.min(this.currentPage * this.pageSize, this.totalElements);
  }

  get pageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  typeClass(type: string): string {
    const t = (type || '').toUpperCase();
    if (t.includes('RECEIVE')) return 'tag-received';
    if (t.includes('DISPATCH')) return 'tag-dispatched';
    if (t.includes('TRANSFER')) return 'tag-transferred';
    if (t.includes('ALLOCAT')) return 'tag-allocated';
    return 'tag-default';
  }

  qtySign(type: string): string {
    const t = (type || '').toUpperCase();
    if (t.includes('RECEIVE') || t.includes('TRANSFER_IN') || t.includes('RELEASE')) return '+';
    if (t.includes('DISPATCH') || t.includes('TRANSFER_OUT') || t.includes('ALLOCATE')) return '-';
    return '';
  }

  qtyClass(type: string): string {
    const t = (type || '').toUpperCase();
    if (t.includes('RECEIVE') || t.includes('TRANSFER_IN')) return 'qty-positive';
    if (t.includes('DISPATCH') || t.includes('TRANSFER_OUT')) return 'qty-negative';
    return 'qty-transfer';
  }
}

