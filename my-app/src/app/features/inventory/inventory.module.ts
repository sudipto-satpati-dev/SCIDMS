import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { InventoryRoutingModule } from './inventory-routing.module';
import { InventoryTrackComponent } from './inventory-track/inventory-track.component';
import { InventoryAllocateComponent } from './inventory-allocate/inventory-allocate.component';
import { StockReceiveComponent } from './stock-receive/stock-receive.component';
import { StockDispatchComponent } from './stock-dispatch/stock-dispatch.component';
import { StockTransferComponent } from './stock-transfer/stock-transfer.component';
import { LowStockAlertsComponent } from './low-stock-alerts/low-stock-alerts.component';
import { InventoryHistoryComponent } from './inventory-history/inventory-history.component';
import { WarehouseStockComponent } from './warehouse-stock/warehouse-stock.component';

@NgModule({
  declarations: [
    InventoryTrackComponent,
    InventoryAllocateComponent,
    StockReceiveComponent,
    StockDispatchComponent,
    StockTransferComponent,
    LowStockAlertsComponent,
    InventoryHistoryComponent,
    WarehouseStockComponent
  ],
  imports: [CommonModule, FormsModule, RouterModule, InventoryRoutingModule]
})
export class InventoryModule {}
