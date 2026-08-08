import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableSearchPopoverComponent } from './components/table-search-popover/table-search-popover.component';
import { TableSortComponent } from './components/table-sort/table-sort.component';
import { ToastContainerComponent } from './components/toast-container/toast-container.component';

@NgModule({
  declarations: [TableSearchPopoverComponent, TableSortComponent, ToastContainerComponent],
  imports: [CommonModule, FormsModule],
  exports: [CommonModule, FormsModule, TableSearchPopoverComponent, TableSortComponent, ToastContainerComponent]
})
export class SharedModule {}


