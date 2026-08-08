import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { ServerErrorComponent } from './server-error.component';

const routes: Routes = [
  {
    path: '',
    component: ServerErrorComponent,
  },
];

@NgModule({
  declarations: [ServerErrorComponent],
  imports: [CommonModule, RouterModule.forChild(routes)],
  exports: [ServerErrorComponent],
})
export class ServerErrorModule {}
