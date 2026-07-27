import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { InventoryTrackComponent } from './inventory-track/inventory-track.component';
import { InventoryAllocateComponent } from './inventory-allocate/inventory-allocate.component';
import { StockReceiveComponent } from './stock-receive/stock-receive.component';
import { StockDispatchComponent } from './stock-dispatch/stock-dispatch.component';
import { StockTransferComponent } from './stock-transfer/stock-transfer.component';
import { LowStockAlertsComponent } from './low-stock-alerts/low-stock-alerts.component';
import { InventoryHistoryComponent } from './inventory-history/inventory-history.component';
import { WarehouseStockComponent } from './warehouse-stock/warehouse-stock.component';

const routes: Routes = [
  { path: '', component: InventoryTrackComponent },
  { path: 'warehouse', component: WarehouseStockComponent },
  { path: 'allocate', component: InventoryAllocateComponent },
  { path: 'receive', component: StockReceiveComponent },
  { path: 'dispatch', component: StockDispatchComponent },
  { path: 'transfer', component: StockTransferComponent },
  { path: 'low-stock', component: LowStockAlertsComponent },
  { path: 'history', component: InventoryHistoryComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class InventoryRoutingModule {}
