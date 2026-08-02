import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ProductsRoutingModule } from './products-routing.module';
import { ProductListComponent } from './product-list/product-list.component';
import { ProductFormComponent } from './product-form/product-form.component';
import { ProductDetailComponent } from './product-detail/product-detail.component';
import { CategoryModalComponent } from './category-modal/category-modal.component';
import { SharedModule } from '../../shared/shared.module';

@NgModule({
  declarations: [ProductListComponent, ProductFormComponent, ProductDetailComponent, CategoryModalComponent],
  imports: [CommonModule, FormsModule, RouterModule, ProductsRoutingModule, SharedModule]
})
export class ProductsModule {}
