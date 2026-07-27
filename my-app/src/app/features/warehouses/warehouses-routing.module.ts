import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { WarehouseListComponent } from './warehouse-list/warehouse-list.component';
import { WarehouseFormComponent } from './warehouse-form/warehouse-form.component';
import { WarehouseCapacityComponent } from './warehouse-capacity/warehouse-capacity.component';

const routes: Routes = [
  { path: '', component: WarehouseListComponent },
  { path: 'new', component: WarehouseFormComponent },
  { path: 'edit/:id', component: WarehouseFormComponent },
  { path: 'capacity', component: WarehouseCapacityComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class WarehousesRoutingModule {}
