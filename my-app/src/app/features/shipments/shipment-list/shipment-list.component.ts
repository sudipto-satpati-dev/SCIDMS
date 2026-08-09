import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ShipmentService } from '../../../core/services/shipment.service';
import { AuthService } from '../../../core/services/auth.service';
import { Shipment, ShipmentListParams } from '../../../core/models/index';

@Component({
  selector: 'app-shipment-list',
  templateUrl: './shipment-list.component.html',
  styleUrls: ['./shipment-list.component.scss']
})
export class ShipmentListComponent implements OnInit {

  shipments: Shipment[] = [];
  loading = true;
  errorMsg = '';

  searchTerm     = '';
  selectedStatus = 'All';

  currentPage   = 1;
  pageSize      = 10;
  totalElements = 0;
  totalPages    = 1;

  statusOptions: string[] = ['All', 'CREATED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED'];

  constructor(
    private shipmentService: ShipmentService,
    private authService: AuthService,
    private router: Router,
  ) {}

  get canCreateShipment(): boolean {
    const role = (this.authService.role || '').toUpperCase();
    return role !== 'MANAGER';
  }

  ngOnInit(): void {
    this.loadShipments();
  }

  loadShipments(): void {
    this.loading = true;
    this.errorMsg = '';

    const user = this.authService.currentUser;
    const currentUsername = user?.username || user?.email || (localStorage.getItem('scidms_user') ? JSON.parse(localStorage.getItem('scidms_user')!).username : '');
    const roleStr = String(this.authService.role || user?.role || '').toUpperCase();
    const isDispatchManager = roleStr.includes('DISTRIBUTION') || roleStr.includes('DISPATCH');

    const params: ShipmentListParams = {
      search: this.searchTerm ? this.searchTerm.trim() : undefined,
      status: this.selectedStatus !== 'All' ? this.selectedStatus : undefined,
      createdBy: isDispatchManager ? (currentUsername || undefined) : undefined,
      page: this.currentPage - 1,
      size: this.pageSize,
      sort: 'createdAt,desc'
    };

    this.shipmentService.getShipments(params).subscribe({
      next: (res) => {
        this.shipments     = res.shipments || [];
        this.totalElements = res.totalElements || 0;
        this.totalPages    = res.totalPages || 1;
        this.loading       = false;
      },
      error: (err) => {
        this.errorMsg = err?.message || 'Could not load shipments.';
        this.loading  = false;
      }
    });
  }

  onSearch(): void {
    this.currentPage = 1;
    this.loadShipments();
  }

  setStatusFilter(status: string): void {
    this.selectedStatus = status;
    this.currentPage = 1;
    this.loadShipments();
  }

  viewShipment(id: string | number): void {
    this.router.navigate(['/shipments', id]);
  }

  createShipment(): void {
    this.router.navigate(['/shipments/new']);
  }

  getStatusClass(status: string): string {
    const s = (status || '').toUpperCase();
    const map: Record<string, string> = {
      'CREATED':     'status-created',
      'IN_TRANSIT':  'status-in-transit',
      'DELIVERED':   'status-delivered',
      'CANCELLED':   'status-returned',
    };
    return map[s] || 'status-created';
  }
}
