import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { UsersRoutingModule } from './users-routing.module';
import { UserListComponent } from './user-list/user-list.component';
import { UserFormComponent } from './user-form/user-form.component';

@NgModule({
  declarations: [UserListComponent, UserFormComponent],
  imports: [CommonModule, FormsModule, RouterModule, UsersRoutingModule]
})
export class UsersModule {}
