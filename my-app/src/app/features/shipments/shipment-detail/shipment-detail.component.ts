import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ShipmentService } from '../../../core/services/shipment.service';
import { Shipment } from '../../../core/models/index';

@Component({
  selector: 'app-shipment-detail',
  templateUrl: './shipment-detail.component.html',
  styleUrls: ['./shipment-detail.component.scss']
})
export class ShipmentDetailComponent implements OnInit {

  shipmentId = '';
  shipment: Shipment | null = null;
  loading = true;
  notFound = false;

  // Failure modal
  showFailureModal  = false;
  failureReason     = 'Customer Unavailable / Premises Closed';
  nextAction        = 'Return';
  failureNotes      = '';
  modalSubmitted    = false;
  submitting        = false;
  toastMessage: string | null = null;

  reasonOptions: string[] = [
    'Customer Unavailable / Premises Closed',
    'Incorrect Delivery Address / Inaccessible',
    'Damaged Package / Refused by Recipient',
    'Severe Weather / Route Blocked',
    'Other Transport Exception',
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private shipmentService: ShipmentService,
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.shipmentId = params['id'];
      this.loadShipment();
    });
  }

  loadShipment(): void {
    this.loading  = true;
    this.notFound = false;
    // Try requested id; fall back to first shipment when browsing via list
    const id = this.shipmentId || 'SHP-4829102-X';
    this.shipmentService.getById(id).subscribe({
      next: (data) => { this.shipment = data; this.loading = false; },
      error: () => {
        // fallback: load first available shipment
        this.shipmentService.getAll().subscribe(list => {
          this.shipment = list[0] ?? null;
          this.notFound = !this.shipment;
          this.loading  = false;
        });
      },
    });
  }

  openFailureModal(): void {
    this.showFailureModal = true;
    this.modalSubmitted   = false;
    this.submitting       = false;
  }

  closeFailureModal(): void { this.showFailureModal = false; }

  submitFailureReport(): void {
    this.modalSubmitted = true;
    if (!this.failureReason || !this.shipment) return;
    this.submitting = true;

    this.shipmentService.reportFailure(this.shipment.id, this.failureReason, this.nextAction).subscribe({
      next: (updated) => {
        this.shipment         = updated;
        this.showFailureModal = false;
        this.submitting       = false;
        this.showToast(`Delivery failure reported for ${updated.id}. Status updated.`);
      },
      error: (err) => {
        this.showToast(err?.message || 'Could not submit failure report.');
        this.submitting = false;
      },
    });
  }

  showToast(msg: string): void {
    this.toastMessage = msg;
    setTimeout(() => { this.toastMessage = null; }, 4000);
  }

  goBack(): void { this.router.navigate(['/shipments']); }

  // ── Stepper helpers ───────────────────────────────────────
  readonly stepOrder = ['Created', 'Ready for Dispatch', 'In Transit', 'Delivered'];

  isStepCompleted(step: string): boolean {
    if (!this.shipment) return false;
    const cur = this.shipment.status;
    if (cur === 'Returned') {
      return ['Created', 'Ready for Dispatch', 'In Transit'].includes(step);
    }
    return this.stepOrder.indexOf(step) < this.stepOrder.indexOf(cur);
  }

  isStepActive(step: string): boolean {
    return !!this.shipment && this.shipment.status === step;
  }

  getStepTimestamp(step: string): string {
    if (!this.shipment) return '';
    const ev = this.shipment.history.find(h => h.status === step);
    return ev ? ev.timestamp.split('•')[0].trim() : '';
  }
}
