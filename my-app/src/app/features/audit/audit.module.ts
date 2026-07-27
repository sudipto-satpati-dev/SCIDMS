import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuditRoutingModule } from './audit-routing.module';
import { AuditLogListComponent } from './audit-log-list/audit-log-list.component';

@NgModule({
  declarations: [AuditLogListComponent],
  imports: [CommonModule, FormsModule, AuditRoutingModule]
})
export class AuditModule {}

