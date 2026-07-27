import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ShipmentsRoutingModule } from './shipments-routing.module';
import { ShipmentListComponent } from './shipment-list/shipment-list.component';
import { ShipmentCreateComponent } from './shipment-create/shipment-create.component';
import { ShipmentDetailComponent } from './shipment-detail/shipment-detail.component';

@NgModule({
  declarations: [ShipmentListComponent, ShipmentCreateComponent, ShipmentDetailComponent],
  imports: [CommonModule, FormsModule, ShipmentsRoutingModule]
})
export class ShipmentsModule {}

