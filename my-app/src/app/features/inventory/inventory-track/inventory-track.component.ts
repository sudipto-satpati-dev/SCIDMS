import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { InventoryService } from '../../../core/services/inventory.service';
import { WarehouseService } from '../../../core/services/warehouse.service';
import { AuthService } from '../../../core/services/auth.service';
import { ApiInventoryItem, Warehouse, InventoryListParams } from '../../../core/models/index';

@Component({
  selector: 'app-inventory-track',
  templateUrl: './inventory-track.component.html',
  styleUrls: ['./inventory-track.component.scss']
})
export class InventoryTrackComponent implements OnInit, OnDestroy {

  items: ApiInventoryItem[] = [];
  warehouses: Warehouse[]   = [];
  loading                   = true;

  searchTerm                 = '';
  filterWarehouseId: string | number = '';
  currentPage                = 1;
  pageSize                   = 10;
  totalElements              = 0;
  totalPages                 = 1;

  isWarehouseManager         = false;

  // Modal State
  showReceiveModal           = false;

  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private inventoryService: InventoryService,
    private warehouseService: WarehouseService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const role = this.authService.role;
    this.isWarehouseManager = role === 'WAREHOUSE_MANAGER' || role === 'Warehouse Manager';

    // Configure 1-second debounce for inventory search
    this.searchSubject
      .pipe(
        debounceTime(1000),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(term => {
        this.searchTerm = term;
        this.currentPage = 1;
        this.loadInventory();
      });

    if (this.isWarehouseManager) {
      this.warehouseService.getMyWarehouses().subscribe({
        next: (list) => {
          this.warehouses = list || [];
          this.loadInventory();
        },
        error: () => {
          this.loadInventory();
        }
      });
    } else {
      this.warehouseService.getAll().subscribe({
        next: (res) => {
          this.warehouses = Array.isArray(res) ? res : res.warehouses || [];
          this.loadInventory();
        },
        error: () => {
          this.loadInventory();
        }
      });
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadInventory(): void {
    this.loading = true;

    let targetWarehouseId = this.filterWarehouseId ? String(this.filterWarehouseId) : undefined;

    // If Warehouse Manager has "All My Warehouses" selected, pass all assigned warehouse IDs
    if (this.isWarehouseManager && !targetWarehouseId && this.warehouses.length > 0) {
      targetWarehouseId = this.warehouses.map(w => w.id).join(',');
    }

    const params: InventoryListParams = {
      search: this.searchTerm || undefined,
      warehouseId: targetWarehouseId,
      page: this.currentPage - 1,
      size: this.pageSize,
    };

    this.inventoryService.getInventory(params).subscribe({
      next: (res) => {
        this.items = res.products || [];
        this.totalElements = res.totalElements || this.items.length;
        this.totalPages = res.totalPages || Math.ceil(this.totalElements / this.pageSize) || 1;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  onFilterChange(): void {
    this.currentPage = 1;
    this.loadInventory();
  }

  onSearchInput(term: string): void {
    this.searchSubject.next(term);
  }

  stockStatus(item: ApiInventoryItem): 'out' | 'low' | 'in' {
    if (item.outOfStock || item.availableQuantity === 0) return 'out';
    if (item.lowStock || item.availableQuantity <= item.lowStockThreshold) return 'low';
    return 'in';
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

  get totalSKUs(): number {
    return new Set(this.items.map(r => r.productId)).size;
  }

  get totalAvailable(): number {
    return this.items.reduce((sum, r) => sum + r.availableQuantity, 0);
  }

  get lowStockCount(): number {
    return this.items.filter(r => this.stockStatus(r) === 'low').length;
  }

  get outOfStockCount(): number {
    return this.items.filter(r => this.stockStatus(r) === 'out').length;
  }

  goToPage(p: number) {
    this.currentPage = p;
    this.loadInventory();
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadInventory();
    }
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadInventory();
    }
  }

  // Trend chart data (mock visualization)
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
      pct: Math.round((w.occupiedCapacity / w.totalCapacity) * 100) || 0,
    }));
  }

  // ── Stock Receive Modal Handlers ───────────────────────────
  // Modal State
  //showReceiveModal  = false;
  showDispatchModal = false;
  showTransferModal = false;

  openReceiveStockModal(): void {
    this.showReceiveModal = true;
  }

  closeReceiveModal(): void {
    this.showReceiveModal = false;
  }

  onStockReceived(): void {
    this.loadInventory();
  }

  openDispatchStockModal(): void {
    this.showDispatchModal = true;
  }

  closeDispatchModal(): void {
    this.showDispatchModal = false;
  }

  onStockDispatched(): void {
    this.loadInventory();
  }

  openTransferStockModal(): void {
    this.showTransferModal = true;
  }

  closeTransferModal(): void {
    this.showTransferModal = false;
  }

  onStockTransferred(): void {
    this.loadInventory();
  }

  goToHistory(): void {
    this.router.navigate(['/inventory/history']);
  }
}

