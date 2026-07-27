import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ShipmentListComponent } from './shipment-list/shipment-list.component';
import { ShipmentCreateComponent } from './shipment-create/shipment-create.component';
import { ShipmentDetailComponent } from './shipment-detail/shipment-detail.component';

const routes: Routes = [
  { path: '', component: ShipmentListComponent },
  { path: 'new', component: ShipmentCreateComponent },
  { path: ':id', component: ShipmentDetailComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ShipmentsRoutingModule {}
