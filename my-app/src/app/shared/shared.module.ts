import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableSearchPopoverComponent } from './components/table-search-popover/table-search-popover.component';

@NgModule({
  declarations: [TableSearchPopoverComponent],
  imports: [CommonModule, FormsModule],
  exports: [CommonModule, FormsModule, TableSearchPopoverComponent]
})
export class SharedModule {}

