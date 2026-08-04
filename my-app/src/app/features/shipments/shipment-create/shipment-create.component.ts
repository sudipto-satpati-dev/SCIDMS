import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { OrderService } from '../../../core/services/order.service';
import { ShipmentService } from '../../../core/services/shipment.service';
import { Order, CreateShipmentRequest } from '../../../core/models/index';

@Component({
  selector: 'app-shipment-create',
  templateUrl: './shipment-create.component.html',
  styleUrls: ['./shipment-create.component.scss']
})
export class ShipmentCreateComponent implements OnInit, OnDestroy {

  approvedOrders: Order[] = [];
  loading = true;
  loadingOrders = false;

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

  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

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

    // Setup 1-second debounce for order search dropdown
    this.searchSubject
      .pipe(
        debounceTime(1000),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe((term) => {
        this.fetchApprovedOrders(term);
      });

    // Initial fetch of 10 approved orders
    this.fetchApprovedOrders('', targetOrderId);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  fetchApprovedOrders(searchTerm = '', targetOrderId?: string | null): void {
    this.loadingOrders = true;

    this.orderService.getOrders({
      status: 'APPROVED',
      search: searchTerm ? searchTerm.trim() : undefined,
      page: 0,
      size: 10,
      sort: 'createdAt,desc'
    }).subscribe({
      next: (res) => {
        this.approvedOrders = res.orders || [];

        if (targetOrderId && !this.selectedOrder) {
          const match = this.approvedOrders.find(o => String(o.id) === String(targetOrderId));
          if (match) {
            this.selectOrder(match);
          } else {
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
        } else if (!this.selectedOrder && this.approvedOrders.length > 0) {
          this.selectOrder(this.approvedOrders[0]);
        }
        this.loading = false;
        this.loadingOrders = false;
      },
      error: () => {
        this.loading = false;
        this.loadingOrders = false;
      }
    });
  }

  onSearchInput(val: string): void {
    this.searchTerm = val;
    this.isDropdownOpen = true;
    this.searchSubject.next(val);
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
    this.fetchApprovedOrders('');
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
