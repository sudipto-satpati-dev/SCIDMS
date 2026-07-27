import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ShipmentService } from '../../../core/services/shipment.service';
import { Shipment } from '../../../core/models/index';

@Component({
  selector: 'app-shipment-list',
  templateUrl: './shipment-list.component.html',
  styleUrls: ['./shipment-list.component.scss']
})
export class ShipmentListComponent implements OnInit {

  shipments: Shipment[] = [];
  loading = true;
  searchTerm     = '';
  selectedStatus = 'All';

  statusOptions: string[] = ['All', 'Created', 'Ready for Dispatch', 'In Transit', 'Delivered', 'Returned'];

  constructor(
    private shipmentService: ShipmentService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.shipmentService.getAll().subscribe(data => {
      this.shipments = data;
      this.loading   = false;
    });
  }

  get filteredShipments(): Shipment[] {
    return this.shipments.filter(s => {
      const matchSearch =
        !this.searchTerm.trim() ||
        s.id.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        s.orderId.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        s.customerName.toLowerCase().includes(this.searchTerm.toLowerCase());
      const matchStatus = this.selectedStatus === 'All' || s.status === this.selectedStatus;
      return matchSearch && matchStatus;
    });
  }

  // Summary counts
  get createdCount():   number { return this.shipments.filter(s => s.status === 'Created').length; }
  get inTransitCount(): number { return this.shipments.filter(s => s.status === 'In Transit').length; }
  get deliveredCount(): number { return this.shipments.filter(s => s.status === 'Delivered').length; }
  get returnedCount():  number { return this.shipments.filter(s => s.status === 'Returned').length; }

  setStatusFilter(status: string): void { this.selectedStatus = status; }

  viewShipment(id: string): void { this.router.navigate(['/shipments', id]); }

  createShipment(): void { this.router.navigate(['/shipments/new']); }

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      'Created':           'status-created',
      'Ready for Dispatch':'status-ready',
      'In Transit':        'status-in-transit',
      'Delivered':         'status-delivered',
      'Returned':          'status-returned',
    };
    return map[status] || '';
  }
}
