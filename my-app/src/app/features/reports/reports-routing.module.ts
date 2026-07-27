import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ReportsDashboardComponent } from './reports-dashboard/reports-dashboard.component';
import { InventoryReportComponent } from './inventory-report/inventory-report.component';
import { OrderReportComponent } from './order-report/order-report.component';
import { ShipmentReportComponent } from './shipment-report/shipment-report.component';

const routes: Routes = [
  { path: '', component: ReportsDashboardComponent },
  { path: 'inventory', component: InventoryReportComponent },
  { path: 'orders', component: OrderReportComponent },
  { path: 'shipments', component: ShipmentReportComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ReportsRoutingModule {}
