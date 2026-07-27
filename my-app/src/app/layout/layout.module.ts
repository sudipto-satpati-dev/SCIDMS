import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SidebarComponent } from './sidebar/sidebar.component';
import { TopbarComponent } from './topbar/topbar.component';
import { MainLayoutComponent } from './main-layout/main-layout.component';

@NgModule({
  declarations: [SidebarComponent, TopbarComponent, MainLayoutComponent],
  imports: [CommonModule, RouterModule],
  exports: [MainLayoutComponent]
})
export class LayoutModule {}
