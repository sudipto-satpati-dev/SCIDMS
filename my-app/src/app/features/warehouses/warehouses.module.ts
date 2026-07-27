import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { WarehousesRoutingModule } from './warehouses-routing.module';
import { WarehouseListComponent } from './warehouse-list/warehouse-list.component';
import { WarehouseFormComponent } from './warehouse-form/warehouse-form.component';
import { WarehouseCapacityComponent } from './warehouse-capacity/warehouse-capacity.component';

@NgModule({
  declarations: [WarehouseListComponent, WarehouseFormComponent, WarehouseCapacityComponent],
  imports: [CommonModule, FormsModule, RouterModule, WarehousesRoutingModule]
})
export class WarehousesModule {}
