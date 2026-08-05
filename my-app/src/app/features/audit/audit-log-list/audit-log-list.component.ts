import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { AuditService } from '../../../core/services/audit.service';
import {
  ApiAuditLog,
  AuditLogListParams,
  AUDIT_ACTIONS,
  AUDIT_MODULES
} from '../../../core/models/index';

@Component({
  selector: 'app-audit-log-list',
  templateUrl: './audit-log-list.component.html',
  styleUrls: ['./audit-log-list.component.scss']
})
export class AuditLogListComponent implements OnInit, OnDestroy {

  auditLogs: ApiAuditLog[] = [];
  loading = true;

  // Filter params
  searchTerm = '';
  selectedAction = '';
  selectedModule = '';
  entityType = '';
  entityId: number | string = '';

  // Pagination
  page = 0;
  size = 10;
  sort = 'timestamp,desc';
  totalElements = 0;
  totalPages = 0;

  selectedEntry: ApiAuditLog | null = null;
  toastMessage: string | null = null;

  readonly actionsList = ['All Actions', ...AUDIT_ACTIONS];
  readonly modulesList = ['All Modules', ...AUDIT_MODULES];

  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  constructor(private auditService: AuditService) {}

  ngOnInit(): void {
    // 1-second debounce for search input
    this.searchSubject.pipe(
      debounceTime(1000),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(term => {
      this.searchTerm = term;
      this.page = 0;
      this.loadAuditLogs();
    });

    this.loadAuditLogs();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSearchInput(term: string): void {
    this.searchSubject.next(term);
  }

  loadAuditLogs(): void {
    this.loading = true;
    const params: AuditLogListParams = {
      page: this.page,
      size: this.size,
      sort: this.sort
    };

    if (this.searchTerm.trim()) params.search = this.searchTerm.trim();
    if (this.selectedAction && this.selectedAction !== 'All Actions') params.action = this.selectedAction;
    if (this.selectedModule && this.selectedModule !== 'All Modules') params.module = this.selectedModule;
    if (this.entityType.trim()) params.entityType = this.entityType.trim();
    if (this.entityId !== '') params.entityId = Number(this.entityId);

    this.auditService.getAuditLogs(params).subscribe({
      next: (res) => {
        this.auditLogs = res.auditlogs || [];
        this.totalElements = res.totalElements || 0;
        this.totalPages = res.totalPages || 0;
        this.loading = false;
      },
      error: (err) => {
        this.showToast(err?.message || 'Failed to load audit logs.');
        this.loading = false;
      }
    });
  }

  applyFilters(): void {
    this.page = 0;
    this.loadAuditLogs();
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.selectedAction = '';
    this.selectedModule = '';
    this.entityType = '';
    this.entityId = '';
    this.page = 0;
    this.loadAuditLogs();
  }

  goToPage(p: number): void {
    if (p < 0 || (this.totalPages > 0 && p >= this.totalPages)) return;
    this.page = p;
    this.loadAuditLogs();
  }

  /**
   * Format timestamp to Date and Hour:Minute only (e.g. Aug 05, 2026 08:30)
   */
  formatShortTimestamp(timestamp: string): string {
    if (!timestamp) return 'N/A';
    try {
      const d = new Date(timestamp);
      if (isNaN(d.getTime())) {
        return timestamp.slice(0, 16).replace('T', ' ');
      }
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const month = months[d.getMonth()];
      const day = String(d.getDate()).padStart(2, '0');
      const year = d.getFullYear();
      const hours = String(d.getHours()).padStart(2, '0');
      const mins = String(d.getMinutes()).padStart(2, '0');
      return `${month} ${day}, ${year} ${hours}:${mins}`;
    } catch {
      return timestamp.slice(0, 16).replace('T', ' ');
    }
  }

  exportCSV(): void {
    if (!this.auditLogs.length) {
      this.showToast('No audit log entries available to export.');
      return;
    }

    let csv = 'Audit ID,User ID,Username,Action,Module,Entity Type,Entity ID,Description,Timestamp\n';
    this.auditLogs.forEach(log => {
      csv += `"${log.id}","${log.userId}","${log.username || ''}","${log.action || ''}","${log.module || ''}","${log.entityType || ''}","${log.entityId}","${log.description || ''}","${log.timestamp || ''}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `SCIDMS_Audit_Logs_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    this.showToast('📄 Audit Trail exported to CSV file successfully!');
  }

  openDetails(entry: ApiAuditLog): void {
    this.selectedEntry = entry;
  }

  closeDetails(): void {
    this.selectedEntry = null;
  }

  showToast(msg: string): void {
    this.toastMessage = msg;
    setTimeout(() => { this.toastMessage = null; }, 3500);
  }

  getActionBadgeClass(action: string): string {
    const act = String(action || '').toUpperCase();
    if (act.includes('CREATED') || act.includes('SUCCESS') || act.includes('REGISTERED') || act.includes('APPROVED')) return 'action-success';
    if (act.includes('UPDATED') || act.includes('STATUS') || act.includes('TRANSFERRED') || act.includes('ALLOCATED')) return 'action-info';
    if (act.includes('FAILED') || act.includes('CANCELLED') || act.includes('REJECTED')) return 'action-danger';
    return 'action-default';
  }

  getModuleBadgeClass(module: string): string {
    const mod = String(module || '').toUpperCase();
    if (mod.includes('AUTHENTICATION')) return 'mod-auth';
    if (mod.includes('USER')) return 'mod-user';
    if (mod.includes('PRODUCT')) return 'mod-product';
    if (mod.includes('WAREHOUSE')) return 'mod-warehouse';
    if (mod.includes('INVENTORY')) return 'mod-inventory';
    if (mod.includes('ORDER')) return 'mod-order';
    if (mod.includes('SHIPMENT')) return 'mod-shipment';
    return 'mod-default';
  }
}
