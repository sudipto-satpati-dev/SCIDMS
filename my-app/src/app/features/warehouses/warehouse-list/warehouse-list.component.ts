import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { WarehouseService } from '../../../core/services/warehouse.service';
import { UserService } from '../../../core/services/user.service';
import { Warehouse, WarehouseStatus, CreateWarehouseRequest, UpdateWarehouseRequest, User } from '../../../core/models/index';

@Component({
  selector: 'app-warehouse-list',
  templateUrl: './warehouse-list.component.html',
  styleUrls: ['./warehouse-list.component.scss']
})
export class WarehouseListComponent implements OnInit, OnDestroy {

  warehouses: Warehouse[] = [];
  loading = true;

  searchTerm   = '';
  filterStatus = '';
  page = 0;
  size = 10;
  totalElements = 0;
  totalPages = 0;
  sort = 'id,asc';

  showFormModal     = false;
  showDeleteModal   = false;
  showManagerModal  = false;

  selectedWarehouse: Warehouse | null = null;
  targetWarehouseForManager: Warehouse | null = null;
  selectedManagerId: number | null = null;
  availableManagers: User[] = [];
  loadingManagers = false;

  isEditMode   = false;
  formErrors: Record<string, string> = {};
  saving   = false;
  errorMsg = '';

  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  photoStyles = [
    'linear-gradient(135deg, #1e3a5f 0%, #2d6a9f 100%)',
    'linear-gradient(135deg, #134e4a 0%, #0f766e 100%)',
    'linear-gradient(135deg, #7c2d12 0%, #c2410c 100%)',
    'linear-gradient(135deg, #1e1b4b 0%, #4338ca 100%)',
    'linear-gradient(135deg, #064e3b 0%, #059669 100%)',
    'linear-gradient(135deg, #312e81 0%, #7c3aed 100%)',
  ];

  constructor(
    private warehouseService: WarehouseService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.searchSubject
      .pipe(
        debounceTime(1000),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe((term) => {
        this.searchTerm = term;
        this.page = 0;
        this.loadWarehouses();
      });

    this.loadWarehouses();
    this.loadAvailableManagers();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadWarehouses(): void {
    this.loading = true;
    this.warehouseService.getAll({
      search: this.searchTerm || undefined,
      status: this.filterStatus || undefined,
      page: this.page,
      size: this.size,
      sort: this.sort
    }).subscribe({
      next: (res) => {
        this.warehouses    = res.warehouses;
        this.page          = res.page;
        this.size          = res.size;
        this.totalElements = res.totalElements;
        this.totalPages    = res.totalPages;
        this.loading       = false;
      },
      error: (err) => {
        this.errorMsg = err?.message || 'Failed to load warehouses.';
        this.loading  = false;
      }
    });
  }

  loadAvailableManagers(): void {
    this.loadingManagers = true;
    this.userService.getAll({ size: 100 }).subscribe({
      next: (res) => {
        this.availableManagers = res.users || [];
        this.loadingManagers   = false;
      },
      error: () => {
        this.loadingManagers = false;
      }
    });
  }

  onSearchChange(term: string): void {
    this.searchSubject.next(term);
  }

  onStatusFilterChange(): void {
    this.page = 0;
    this.loadWarehouses();
  }

  getPhoto(idx: number): string {
    return this.photoStyles[idx % this.photoStyles.length];
  }

  utilPct(w: Warehouse): number {
    if (!w.totalCapacity || w.totalCapacity <= 0) return 0;
    return Math.round((w.occupiedCapacity / w.totalCapacity) * 100);
  }

  utilClass(w: Warehouse): string {
    const p = this.utilPct(w);
    if (p > 90) return 'bar-critical';
    if (p >= 70) return 'bar-warning';
    return 'bar-ok';
  }

  utilLabel(w: Warehouse): string {
    const p = this.utilPct(w);
    if (p > 90) return 'Critical';
    if (p >= 70) return 'Near Capacity';
    return 'Healthy';
  }

  utilLabelClass(w: Warehouse): string {
    const p = this.utilPct(w);
    if (p > 90) return 'lbl-critical';
    if (p >= 70) return 'lbl-warning';
    return 'lbl-ok';
  }

  get totalCount():        number { return this.totalElements || this.warehouses.length; }
  get operationalCount():  number { return this.warehouses.filter(w => w.status === 'ACTIVE').length; }
  get nearCapacityCount(): number { return this.warehouses.filter(w => this.utilPct(w) >= 70).length; }

  openAddModal(): void {
    this.isEditMode = false;
    this.selectedWarehouse = {
      id: 0,
      name: '',
      location: '',
      totalCapacity: 10000,
      occupiedCapacity: 0,
      availableCapacity: 10000,
      status: 'ACTIVE',
      createdAt: '',
      updatedAt: '',
      managerId: null,
      managerUsername: null,
      managerEmail: null
    };
    this.formErrors = {};
    this.errorMsg   = '';
    this.showFormModal = true;
  }

  openEditModal(w: Warehouse, e: Event): void {
    e.stopPropagation();
    this.isEditMode      = true;
    this.selectedWarehouse = { ...w };
    this.formErrors      = {};
    this.errorMsg        = '';
    this.showFormModal   = true;
  }

  openAssignManagerModal(w: Warehouse, e: Event): void {
    e.stopPropagation();
    this.targetWarehouseForManager = w;
    this.selectedManagerId = w.managerId || null;
    this.errorMsg = '';
    this.showManagerModal = true;
    if (!this.availableManagers.length) {
      this.loadAvailableManagers();
    }
  }

  submitAssignManager(): void {
    if (!this.targetWarehouseForManager || !this.selectedManagerId) return;
    this.saving = true;
    this.errorMsg = '';

    this.warehouseService.assignManager(
      this.targetWarehouseForManager.id,
      Number(this.selectedManagerId)
    ).subscribe({
      next: () => {
        this.saving = false;
        this.showManagerModal = false;
        this.loadWarehouses();
      },
      error: (err) => {
        this.errorMsg = err?.message || 'Could not assign manager.';
        this.saving = false;
      }
    });
  }

  removeManager(w: Warehouse, e: Event): void {
    e.stopPropagation();
    if (!w.managerId) return;
    this.errorMsg = '';
    this.warehouseService.removeManager(w.id).subscribe({
      next: () => {
        this.loadWarehouses();
      },
      error: (err) => {
        this.errorMsg = err?.message || 'Could not remove manager.';
      }
    });
  }

  validateField(field: string): void {
    if (!this.selectedWarehouse) return;
    const e = { ...this.formErrors };
    if (field === 'name')     e['name']     = !this.selectedWarehouse.name?.trim()     ? 'Warehouse name is required.'      : '';
    if (field === 'location') e['location'] = !this.selectedWarehouse.location?.trim() ? 'Location is required.'            : '';
    if (field === 'capacity') e['capacity'] = (!this.selectedWarehouse.totalCapacity || this.selectedWarehouse.totalCapacity <= 0) ? 'Capacity must be greater than 0.' : '';
    Object.keys(e).forEach(k => { if (!e[k]) delete e[k]; });
    this.formErrors = e;
  }

  saveWarehouse(): void {
    ['name', 'location', 'capacity'].forEach(f => this.validateField(f));
    if (Object.keys(this.formErrors).length || !this.selectedWarehouse) return;
    this.saving   = true;
    this.errorMsg = '';

    if (this.isEditMode) {
      const payload: UpdateWarehouseRequest = {
        name: this.selectedWarehouse.name.trim(),
        location: this.selectedWarehouse.location.trim(),
        totalCapacity: Number(this.selectedWarehouse.totalCapacity)
      };

      this.warehouseService.update(this.selectedWarehouse.id, payload).subscribe({
        next: () => {
          this.saving        = false;
          this.showFormModal = false;
          this.loadWarehouses();
        },
        error: (err) => {
          this.errorMsg = err?.message || 'Could not update warehouse.';
          this.saving   = false;
        }
      });
    } else {
      const payload: CreateWarehouseRequest = {
        name: this.selectedWarehouse.name.trim(),
        location: this.selectedWarehouse.location.trim(),
        totalCapacity: Number(this.selectedWarehouse.totalCapacity)
      };

      this.warehouseService.create(payload).subscribe({
        next: () => {
          this.saving        = false;
          this.showFormModal = false;
          this.loadWarehouses();
        },
        error: (err) => {
          this.errorMsg = err?.message || 'Could not create warehouse.';
          this.saving   = false;
        }
      });
    }
  }

  toggleStatus(w: Warehouse, e: Event): void {
    e.stopPropagation();
    this.warehouseService.toggleStatus(w.id, w.status).subscribe({
      next: () => {
        this.loadWarehouses();
      },
      error: (err) => {
        this.errorMsg = err?.message || 'Could not toggle status.';
      }
    });
  }
}
