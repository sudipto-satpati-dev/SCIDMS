import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { OrderService } from '../../../core/services/order.service';
import { ShipmentService } from '../../../core/services/shipment.service';
import { Order } from '../../../core/models/index';

@Component({
  selector: 'app-shipment-create',
  templateUrl: './shipment-create.component.html',
  styleUrls: ['./shipment-create.component.scss']
})
export class ShipmentCreateComponent implements OnInit {

  approvedOrders: Order[] = [];
  loading = true;

  searchTerm      = '';
  isDropdownOpen  = false;
  selectedOrder: Order | null = null;

  shipmentDate  = '';
  carrierMethod = '';
  notes         = '';

  showSuccessModal  = false;
  createdShipmentId = '';
  formSubmitted     = false;
  submitting        = false;
  errorMsg          = '';

  constructor(
    private router: Router,
    private orderService: OrderService,
    private shipmentService: ShipmentService,
  ) {}

  ngOnInit(): void {
    const today = new Date();
    this.shipmentDate = today.toISOString().split('T')[0];

    this.orderService.getAll().subscribe(orders => {
      this.approvedOrders = orders.filter(o => o.status === 'Approved');
      if (this.approvedOrders.length > 0) this.selectOrder(this.approvedOrders[0]);
      this.loading = false;
    });
  }

  get filteredOrders(): Order[] {
    if (!this.searchTerm.trim()) return this.approvedOrders;
    const term = this.searchTerm.toLowerCase();
    return this.approvedOrders.filter(o =>
      o.id.toLowerCase().includes(term) ||
      o.customerName.toLowerCase().includes(term)
    );
  }

  orderItemSummary(o: Order): string {
    return o.items.map(i => `${i.productName} ×${i.quantity}`).join(', ');
  }

  orderValue(o: Order): number { return o.items.reduce((s, i) => s + i.unitPrice * i.quantity, 0); }

  toggleDropdown(): void { this.isDropdownOpen = !this.isDropdownOpen; }
  closeDropdown(): void { setTimeout(() => { this.isDropdownOpen = false; }, 200); }

  selectOrder(order: Order): void {
    this.selectedOrder  = order;
    this.searchTerm     = `${order.id} - ${order.customerName}`;
    this.isDropdownOpen = false;
  }

  clearSelection(event: Event): void {
    event.stopPropagation();
    this.selectedOrder = null;
    this.searchTerm    = '';
  }

  onSubmit(): void {
    this.formSubmitted = true;
    if (!this.selectedOrder || !this.shipmentDate) return;
    this.submitting = true;
    this.errorMsg   = '';

    this.shipmentService.createFromOrder(this.selectedOrder.id).subscribe({
      next: (shipment) => {
        this.createdShipmentId = shipment.id;
        this.showSuccessModal  = true;
        this.submitting        = false;
      },
      error: (err) => {
        this.errorMsg  = err?.message || 'Could not create shipment.';
        this.submitting = false;
      },
    });
  }

  onCancel(): void { this.router.navigate(['/shipments']); }

  closeSuccessModal(): void {
    this.showSuccessModal = false;
    this.router.navigate(['/shipments']);
  }
}
