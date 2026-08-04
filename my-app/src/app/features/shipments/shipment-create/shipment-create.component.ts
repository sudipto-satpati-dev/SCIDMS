import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { OrderService } from '../../../core/services/order.service';
import { ShipmentService } from '../../../core/services/shipment.service';
import { Order, CreateShipmentRequest } from '../../../core/models/index';

@Component({
  selector: 'app-shipment-create',
  templateUrl: './shipment-create.component.html',
  styleUrls: ['./shipment-create.component.scss']
})
export class ShipmentCreateComponent implements OnInit {

  approvedOrders: Order[] = [];
  loading = true;

  searchTerm     = '';
  isDropdownOpen = false;
  selectedOrder: Order | null = null;

  carrierName          = 'FedEx Express';
  trackingNumber       = '';
  expectedDeliveryDate = '';
  notes                = '';

  showSuccessModal  = false;
  createdShipmentId = '';
  formSubmitted     = false;
  submitting        = false;
  errorMsg          = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private orderService: OrderService,
    private shipmentService: ShipmentService,
  ) {}

  ngOnInit(): void {
    const defaultDate = new Date(Date.now() + 86400000 * 3);
    this.expectedDeliveryDate = defaultDate.toISOString().split('T')[0];
    this.trackingNumber = 'TRK-' + Math.floor(100000 + Math.random() * 900000);

    const targetOrderId = this.route.snapshot.queryParamMap.get('orderId');

    this.orderService.getAll().subscribe({
      next: (orders) => {
        // Filter for orders with status PACKED or APPROVED
        this.approvedOrders = orders.filter(o => {
          const st = String(o.status || '').toUpperCase();
          return st === 'PACKED' || st === 'APPROVED';
        });

        if (targetOrderId) {
          const match = this.approvedOrders.find(o => String(o.id) === String(targetOrderId));
          if (match) {
            this.selectOrder(match);
          } else {
            // If order id passed but not in packed/approved list, fetch directly
            this.orderService.getById(targetOrderId).subscribe({
              next: (ord) => {
                if (ord) {
                  this.approvedOrders.unshift(ord);
                  this.selectOrder(ord);
                }
              },
              error: () => {}
            });
          }
        } else if (this.approvedOrders.length > 0) {
          this.selectOrder(this.approvedOrders[0]);
        }
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  get filteredOrders(): Order[] {
    if (!this.searchTerm.trim()) return this.approvedOrders;
    const term = this.searchTerm.toLowerCase();
    return this.approvedOrders.filter(o =>
      String(o.id).toLowerCase().includes(term) ||
      (o.orderNumber && o.orderNumber.toLowerCase().includes(term)) ||
      o.customerName.toLowerCase().includes(term)
    );
  }

  toggleDropdown(): void { this.isDropdownOpen = !this.isDropdownOpen; }
  closeDropdown(): void { setTimeout(() => { this.isDropdownOpen = false; }, 200); }

  selectOrder(order: Order): void {
    this.selectedOrder  = order;
    this.searchTerm     = `${order.orderNumber || ('#ORD-' + order.id)} - ${order.customerName}`;
    this.isDropdownOpen = false;
  }

  clearSelection(event: Event): void {
    event.stopPropagation();
    this.selectedOrder = null;
    this.searchTerm    = '';
  }

  onSubmit(): void {
    this.formSubmitted = true;
    if (!this.selectedOrder || !this.carrierName.trim() || !this.trackingNumber.trim() || !this.expectedDeliveryDate) {
      return;
    }
    this.submitting = true;
    this.errorMsg   = '';

    const req: CreateShipmentRequest = {
      orderId:              this.selectedOrder.id,
      carrierName:          this.carrierName.trim(),
      trackingNumber:       this.trackingNumber.trim(),
      expectedDeliveryDate: this.expectedDeliveryDate
    };

    this.shipmentService.createShipmentApi(req).subscribe({
      next: (shipment) => {
        this.createdShipmentId = shipment.shipmentNumber || String(shipment.id);
        this.showSuccessModal  = true;
        this.submitting        = false;
      },
      error: (err) => {
        this.errorMsg   = err?.message || 'Could not create shipment.';
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
