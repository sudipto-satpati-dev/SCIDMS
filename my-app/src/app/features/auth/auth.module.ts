import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthRoutingModule } from './auth-routing.module';
import { LoginComponent } from './login/login.component';
import { ChangePasswordComponent } from './change-password/change-password.component';

@NgModule({
  declarations: [LoginComponent, ChangePasswordComponent],
  imports: [CommonModule, FormsModule, RouterModule, AuthRoutingModule]
})
export class AuthModule {}
