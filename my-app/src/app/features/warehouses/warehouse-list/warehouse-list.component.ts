import { Component, OnInit } from '@angular/core';
import { WarehouseService } from '../../../core/services/warehouse.service';
import { Warehouse, WarehouseRegion } from '../../../core/models/index';

@Component({
  selector: 'app-warehouse-list',
  templateUrl: './warehouse-list.component.html',
  styleUrls: ['./warehouse-list.component.scss']
})
export class WarehouseListComponent implements OnInit {

  warehouses: Warehouse[] = [];
  loading = true;

  searchTerm   = '';
  filterStatus = '';
  showFormModal     = false;
  showDeleteModal   = false;
  selectedWarehouse: Warehouse | null = null;
  isEditMode   = false;
  formErrors: Record<string, string> = {};
  saving   = false;
  errorMsg = '';

  photoStyles = [
    'linear-gradient(135deg, #1e3a5f 0%, #2d6a9f 100%)',
    'linear-gradient(135deg, #134e4a 0%, #0f766e 100%)',
    'linear-gradient(135deg, #7c2d12 0%, #c2410c 100%)',
    'linear-gradient(135deg, #1e1b4b 0%, #4338ca 100%)',
    'linear-gradient(135deg, #064e3b 0%, #059669 100%)',
    'linear-gradient(135deg, #312e81 0%, #7c3aed 100%)',
  ];

  regions: WarehouseRegion[] = ['Dhaka', 'Chittagong', 'Sylhet', 'Rajshahi', 'Khulna'];

  constructor(private warehouseService: WarehouseService) {}

  ngOnInit(): void {
    this.warehouseService.getAll().subscribe(data => {
      this.warehouses = data;
      this.loading    = false;
    });
  }

  utilPct(w: Warehouse): number { return Math.round((w.occupiedCapacity / w.totalCapacity) * 100); }

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

  get filtered(): Warehouse[] {
    return this.warehouses.filter(w => {
      const s = this.searchTerm.toLowerCase();
      const matchSearch = !s || w.name.toLowerCase().includes(s) || w.id.toLowerCase().includes(s) || w.location.toLowerCase().includes(s);
      const matchStatus = !this.filterStatus || w.status === this.filterStatus;
      return matchSearch && matchStatus;
    });
  }

  get totalCount():        number { return this.warehouses.length; }
  get operationalCount():  number { return this.warehouses.filter(w => w.status === 'Active').length; }
  get nearCapacityCount(): number { return this.warehouses.filter(w => this.utilPct(w) >= 70).length; }
  get regionsCount():      number { return new Set(this.warehouses.map(w => w.region)).size; }

  openAddModal(): void {
    this.isEditMode = false;
    this.selectedWarehouse = {
      id: '', name: '', location: '', region: 'Dhaka',
      totalCapacity: 0, occupiedCapacity: 0, status: 'Active', photo: this.photoStyles[0],
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

  validateField(field: string): void {
    if (!this.selectedWarehouse) return;
    const e = { ...this.formErrors };
    if (field === 'name')     e['name']     = !this.selectedWarehouse.name.trim()     ? 'Warehouse name is required.'      : '';
    if (field === 'location') e['location'] = !this.selectedWarehouse.location.trim() ? 'Location is required.'            : '';
    if (field === 'capacity') e['capacity'] = this.selectedWarehouse.totalCapacity <= 0 ? 'Capacity must be greater than 0.' : '';
    Object.keys(e).forEach(k => { if (!e[k]) delete e[k]; });
    this.formErrors = e;
  }

  saveWarehouse(): void {
    ['name', 'location', 'capacity'].forEach(f => this.validateField(f));
    if (Object.keys(this.formErrors).length || !this.selectedWarehouse) return;
    this.saving = true;

    const photoIdx = this.warehouses.length % this.photoStyles.length;
    const payload  = { ...this.selectedWarehouse, photo: this.selectedWarehouse.photo || this.photoStyles[photoIdx] };

    const action$ = this.isEditMode
      ? this.warehouseService.update(this.selectedWarehouse.id, payload)
      : this.warehouseService.create(payload);

    action$.subscribe({
      next: (saved) => {
        if (this.isEditMode) {
          const idx = this.warehouses.findIndex(w => w.id === saved.id);
          if (idx > -1) this.warehouses[idx] = saved;
        } else {
          this.warehouses.push(saved);
        }
        this.saving        = false;
        this.showFormModal = false;
      },
      error: (err) => {
        this.errorMsg = err?.message || 'Could not save warehouse.';
        this.saving   = false;
      },
    });
  }

  toggleStatus(w: Warehouse, e: Event): void {
    e.stopPropagation();
    this.warehouseService.toggleStatus(w.id).subscribe({
      next: (updated) => {
        const idx = this.warehouses.findIndex(x => x.id === updated.id);
        if (idx > -1) this.warehouses[idx] = updated;
      },
    });
  }
}
