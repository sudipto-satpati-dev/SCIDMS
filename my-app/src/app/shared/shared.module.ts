import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableSearchPopoverComponent } from './components/table-search-popover/table-search-popover.component';
import { TableSortComponent } from './components/table-sort/table-sort.component';

@NgModule({
  declarations: [TableSearchPopoverComponent, TableSortComponent],
  imports: [CommonModule, FormsModule],
  exports: [CommonModule, FormsModule, TableSearchPopoverComponent, TableSortComponent]
})
export class SharedModule {}


