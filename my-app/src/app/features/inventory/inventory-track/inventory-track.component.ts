import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import Chart from 'chart.js/auto';
import { InventoryService } from '../../../core/services/inventory.service';
import { WarehouseService } from '../../../core/services/warehouse.service';
import { AuthService } from '../../../core/services/auth.service';
import { ApiInventoryItem, Warehouse, InventoryListParams, ApiInventoryTransaction } from '../../../core/models/index';

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
  showDispatchModal          = false;
  showTransferModal          = false;

  // Chart State
  private chart: Chart | null = null;
  public chartView: 'bar' | 'doughnut' = 'bar';
  public rawTransactions: ApiInventoryTransaction[] = [];
  public totalReceivedQty    = 0;
  public totalDispatchedQty  = 0;
  public totalTransferredQty = 0;
  public totalAllocatedQty   = 0;
  public loadingChart        = false;

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
          this.loadTransactionChartData();
        },
        error: () => {
          this.loadInventory();
          this.loadTransactionChartData();
        }
      });
    } else {
      this.warehouseService.getAll().subscribe({
        next: (res) => {
          this.warehouses = Array.isArray(res) ? res : res.warehouses || [];
          this.loadInventory();
          this.loadTransactionChartData();
        },
        error: () => {
          this.loadInventory();
          this.loadTransactionChartData();
        }
      });
    }
  }

  ngOnDestroy(): void {
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }
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

  loadTransactionChartData(): void {
    this.loadingChart = true;
    let targetWarehouseId = this.filterWarehouseId ? String(this.filterWarehouseId) : undefined;
    if (this.isWarehouseManager && !targetWarehouseId && this.warehouses.length > 0) {
      targetWarehouseId = this.warehouses.map(w => w.id).join(',');
    }

    this.inventoryService.getTransactionHistory({ warehouseId: targetWarehouseId, size: 50 }).subscribe({
      next: (res) => {
        const txns = res.transactions || [];
        this.processTransactionsAndRenderChart(txns);
      },
      error: () => {
        this.processTransactionsAndRenderChart([]);
      }
    });
  }

  private processTransactionsAndRenderChart(txns: any[]): void {
    this.rawTransactions = txns;

    let received = 0;
    let dispatched = 0;
    let transferred = 0;
    let allocated = 0;

    txns.forEach(t => {
      const type = (t.transactionType || t.type || '').toString().toUpperCase();
      const qty = Number(t.quantity || 0);

      if (type.includes('RECEIVE') || type.includes('INBOUND')) {
        received += qty;
      } else if (type.includes('DISPATCH') || type.includes('OUTBOUND')) {
        dispatched += qty;
      } else if (type.includes('TRANSFER')) {
        transferred += qty;
      } else if (type.includes('ALLOCAT')) {
        allocated += qty;
      } else {
        received += qty;
      }
    });

    this.totalReceivedQty = received;
    this.totalDispatchedQty = dispatched;
    this.totalTransferredQty = transferred;
    this.totalAllocatedQty = allocated;
    this.loadingChart = false;

    setTimeout(() => {
      this.renderChart();
    }, 50);
  }

  setChartView(mode: 'bar' | 'doughnut'): void {
    this.chartView = mode;
    this.renderChart();
  }

  private renderChart(): void {
    const canvas = document.getElementById('inventoryTransactionChart') as HTMLCanvasElement;
    if (!canvas) return;

    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }

    const labels = ['Received (Inbound)', 'Dispatched (Outbound)', 'Transferred', 'Allocated'];
    const data = [
      this.totalReceivedQty,
      this.totalDispatchedQty,
      this.totalTransferredQty,
      this.totalAllocatedQty
    ];

    const backgroundColors = [
      'rgba(16, 185, 129, 0.85)',
      'rgba(37, 99, 235, 0.85)',
      'rgba(245, 158, 11, 0.85)',
      'rgba(139, 92, 246, 0.85)'
    ];

    const borderColors = [
      '#10b981',
      '#2563eb',
      '#f59e0b',
      '#8b5cf6'
    ];

    this.chart = new Chart(canvas, {
      type: this.chartView,
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Stock Units',
            data: data,
            backgroundColor: backgroundColors,
            borderColor: borderColors,
            borderWidth: 1.5,
            borderRadius: this.chartView === 'bar' ? 6 : 0,
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: this.chartView === 'doughnut',
            position: 'bottom',
            labels: {
              font: { family: 'Inter', size: 12 },
              padding: 14,
              usePointStyle: true,
            }
          },
          tooltip: {
            callbacks: {
              label: (context) => ` ${context.label}: ${context.formattedValue} units`
            }
          }
        },
        scales: this.chartView === 'bar' ? {
          y: {
            beginAtZero: true,
            grid: { color: '#f1f5f9' },
            ticks: { font: { family: 'Inter', size: 11 } }
          },
          x: {
            grid: { display: false },
            ticks: { font: { family: 'Inter', size: 11 } }
          }
        } : {}
      }
    });
  }

  onFilterChange(): void {
    this.currentPage = 1;
    this.loadInventory();
    this.loadTransactionChartData();
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

  get capacityData(): { name: string; pct: number }[] {
    return this.warehouses.map(w => ({
      name: w.name,
      pct: Math.round((w.occupiedCapacity / w.totalCapacity) * 100) || 0,
    }));
  }

  // ── Stock Modal Handlers ───────────────────────────
  openReceiveStockModal(): void {
    this.showReceiveModal = true;
  }

  closeReceiveModal(): void {
    this.showReceiveModal = false;
  }

  onStockReceived(): void {
    this.loadInventory();
    this.loadTransactionChartData();
  }

  openDispatchStockModal(): void {
    this.showDispatchModal = true;
  }

  closeDispatchModal(): void {
    this.showDispatchModal = false;
  }

  onStockDispatched(): void {
    this.loadInventory();
    this.loadTransactionChartData();
  }

  openTransferStockModal(): void {
    this.showTransferModal = true;
  }

  closeTransferModal(): void {
    this.showTransferModal = false;
  }

  onStockTransferred(): void {
    this.loadInventory();
    this.loadTransactionChartData();
  }

  goToHistory(): void {
    this.router.navigate(['/inventory/history']);
  }
}
