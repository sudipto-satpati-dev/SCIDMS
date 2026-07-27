import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReportsRoutingModule } from './reports-routing.module';
import { ReportsDashboardComponent } from './reports-dashboard/reports-dashboard.component';
import { InventoryReportComponent } from './inventory-report/inventory-report.component';
import { OrderReportComponent } from './order-report/order-report.component';
import { ShipmentReportComponent } from './shipment-report/shipment-report.component';

@NgModule({
  declarations: [
    ReportsDashboardComponent,
    InventoryReportComponent,
    OrderReportComponent,
    ShipmentReportComponent
  ],
  imports: [CommonModule, FormsModule, ReportsRoutingModule]
})
export class ReportsModule {}

