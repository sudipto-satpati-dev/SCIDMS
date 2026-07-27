import { Component, OnInit } from '@angular/core';
import { AuditService } from '../../../core/services/audit.service';
import { AuditLog, AuditModule } from '../../../core/models/index';

@Component({
  selector: 'app-audit-log-list',
  templateUrl: './audit-log-list.component.html',
  styleUrls: ['./audit-log-list.component.scss']
})
export class AuditLogListComponent implements OnInit {

  auditLogs: AuditLog[] = [];
  loading = true;

  searchTerm     = '';
  selectedModule = 'All Modules';
  startDate      = '';
  endDate        = '';

  selectedEntry: AuditLog | null = null;
  toastMessage: string | null    = null;

  modulesList: string[] = ['All Modules', 'PRODUCTS', 'WAREHOUSES', 'SHIPMENTS', 'ORDERS', 'USERS', 'INVENTORY'];

  constructor(private auditService: AuditService) {}

  ngOnInit(): void {
    this.auditService.getAll().subscribe(data => {
      this.auditLogs = data;
      this.loading   = false;
    });
  }

  get filteredAuditLogs(): AuditLog[] {
    return this.auditLogs.filter(log => {
      const matchSearch =
        !this.searchTerm.trim() ||
        log.actorName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        log.action.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        log.recordRef.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        log.reason.toLowerCase().includes(this.searchTerm.toLowerCase());
      const matchModule =
        this.selectedModule === 'All Modules' || log.module === this.selectedModule;
      return matchSearch && matchModule;
    });
  }

  applyFilters(): void { this.showToast('Filters applied to Audit Trail.'); }

  exportCSV(): void {
    const filename = `SCIDMS_Audit_Trail_${new Date().toISOString().slice(0, 10)}.csv`;
    this.showToast(`📄 Exporting Audit Logs... Download starting for ${filename}`);
  }

  openDetails(entry: AuditLog): void  { this.selectedEntry = entry; }
  closeDetails(): void                { this.selectedEntry = null;  }

  showToast(msg: string): void {
    this.toastMessage = msg;
    setTimeout(() => { this.toastMessage = null; }, 3500);
  }

  getActionClass(action: string): string {
    const map: Record<string, string> = { Created: 'action-created', Updated: 'action-updated', Deleted: 'action-deleted' };
    return map[action] || '';
  }

  getModuleClass(module: string): string {
    const map: Record<string, string> = {
      PRODUCTS: 'mod-products', WAREHOUSES: 'mod-warehouses',
      SHIPMENTS: 'mod-shipments', ORDERS: 'mod-orders',
      USERS: 'mod-users', INVENTORY: 'mod-inventory',
    };
    return map[module] || '';
  }
}
