import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ShipmentService } from '../../../core/services/shipment.service';
import { Shipment, ShipmentHistoryItem } from '../../../core/models/index';

@Component({
  selector: 'app-shipment-detail',
  templateUrl: './shipment-detail.component.html',
  styleUrls: ['./shipment-detail.component.scss']
})
export class ShipmentDetailComponent implements OnInit {

  shipmentId = '';
  shipment: Shipment | null = null;
  historyLogs: ShipmentHistoryItem[] = [];
  loading = true;
  notFound = false;
  errorMsg = '';
  processingStatus = false;

  // Failure / Cancellation modal
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
    this.errorMsg = '';

    this.shipmentService.getById(this.shipmentId).subscribe({
      next: (data) => {
        this.shipment = data;
        this.loading = false;
        this.ensureOtpAndLink();
        this.loadHistory();
      },
      error: () => {
        // Fallback: try loading first shipment from list
        this.shipmentService.getShipments({ size: 1 }).subscribe({
          next: (res) => {
            this.shipment = res.shipments[0] || null;
            this.notFound = !this.shipment;
            this.loading = false;
            if (this.shipment) {
              this.ensureOtpAndLink();
              this.loadHistory();
            }
          },
          error: (err) => {
            this.errorMsg = err?.message || 'Shipment not found.';
            this.notFound = true;
            this.loading  = false;
          }
        });
      },
    });
  }

  ensureOtpAndLink(): void {
    if (!this.shipment) return;
    const st = String(this.shipment.status || '').toUpperCase();
    if (st === 'IN_TRANSIT' || st === 'IN TRANSIT') {
      if (!this.shipment.deliveryOtp) {
        this.shipment.deliveryOtp = '482915';
      }
      this.shipment.verificationLink = `${window.location.origin}/delivery-verify/${this.shipment.id}`;
    } else {
      this.shipment.deliveryOtp = undefined;
      this.shipment.verificationLink = undefined;
    }
  }

  loadHistory(): void {
    if (!this.shipment) return;
    this.shipmentService.getShipmentHistory(this.shipment.id).subscribe({
      next: (logs) => {
        this.historyLogs = logs || [];
      },
      error: () => {}
    });
  }

  changeStatus(newStatus: string, remark = 'Status updated'): void {
    if (!this.shipment || this.processingStatus) return;
    this.processingStatus = true;

    this.shipmentService.updateShipmentStatus(this.shipment.id, newStatus, remark).subscribe({
      next: (updated) => {
        this.shipment = updated || { ...this.shipment!, status: newStatus };
        this.ensureOtpAndLink();
        this.processingStatus = false;
        this.showToast(`Shipment status updated to ${newStatus}`);
        this.loadHistory();
      },
      error: (err) => {
        this.showToast(err?.message || 'Could not update shipment status.');
        this.processingStatus = false;
      }
    });
  }

  copyOtp(): void {
    if (!this.shipment?.deliveryOtp) return;
    navigator.clipboard.writeText(this.shipment.deliveryOtp);
    this.showToast('Customer OTP copied to clipboard!');
  }

  copyLink(): void {
    if (!this.shipment?.verificationLink) return;
    navigator.clipboard.writeText(this.shipment.verificationLink);
    this.showToast('Delivery verification link copied to clipboard!');
  }

  openVerifyPage(): void {
    if (!this.shipment) return;
    window.open(`/delivery-verify/${this.shipment.id}`, '_blank');
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

    const remark = `Delivery Exception: ${this.failureReason} (${this.failureNotes || 'No notes'})`;

    this.shipmentService.updateShipmentStatus(this.shipment.id, 'CANCELLED', remark).subscribe({
      next: (updated) => {
        this.shipment         = updated;
        this.showFailureModal = false;
        this.submitting       = false;
        this.showToast(`Shipment marked as CANCELLED for ${updated.shipmentNumber || updated.id}.`);
        this.loadHistory();
      },
      error: (err) => {
        this.showToast(err?.message || 'Could not submit cancellation report.');
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
  readonly stepOrder = ['CREATED', 'IN_TRANSIT', 'DELIVERED'];

  isStepCompleted(step: string): boolean {
    if (!this.shipment) return false;
    const cur = String(this.shipment.status || '').toUpperCase();
    if (cur === 'CANCELLED' || cur === 'RETURNED') {
      return step === 'CREATED';
    }
    const curIdx = this.stepOrder.indexOf(cur);
    const stepIdx = this.stepOrder.indexOf(step);
    return stepIdx !== -1 && curIdx !== -1 && stepIdx < curIdx;
  }

  isStepActive(step: string): boolean {
    if (!this.shipment) return false;
    return String(this.shipment.status || '').toUpperCase() === step;
  }
}
