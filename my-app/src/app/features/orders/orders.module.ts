import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { OrdersRoutingModule } from './orders-routing.module';
import { OrderListComponent } from './order-list/order-list.component';
import { OrderCreateComponent } from './order-create/order-create.component';
import { OrderDetailComponent } from './order-detail/order-detail.component';
import { OrderApprovalComponent } from './order-approval/order-approval.component';

@NgModule({
  declarations: [
    OrderListComponent,
    OrderCreateComponent,
    OrderDetailComponent,
    OrderApprovalComponent
  ],
  imports: [CommonModule, FormsModule, RouterModule, OrdersRoutingModule]
})
export class OrdersModule {}
