import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-change-password',
  templateUrl: './change-password.component.html',
  styleUrls: ['./change-password.component.scss']
})
export class ChangePasswordComponent {
  currentPassword = '';
  newPassword = '';
  confirmPassword = '';

  showCurrentPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;

  isLoading = false;
  errorMessage = '';
  successMessage = '';

  constructor(private router: Router, private auth: AuthService) {}

  // ── Live validation getters ────────────────────────────────
  get hasMinLength(): boolean {
    return this.newPassword.length >= 8;
  }

  get hasUppercase(): boolean {
    return /[A-Z]/.test(this.newPassword);
  }

  get hasNumber(): boolean {
    return /[0-9]/.test(this.newPassword);
  }

  get hasSpecial(): boolean {
    return /[!@#$%^&*(),.?":{}|<>]/.test(this.newPassword);
  }

  get isMatching(): boolean {
    return this.newPassword.length > 0 && this.newPassword === this.confirmPassword;
  }

  get isPasswordValid(): boolean {
    return this.hasMinLength && this.hasUppercase && this.hasNumber && this.hasSpecial && this.isMatching;
  }

  // ── Submit ─────────────────────────────────────────────────
  onSubmit(): void {
    this.errorMessage = '';

    if (!this.currentPassword) {
      this.errorMessage = 'Please enter your temporary password.';
      return;
    }

    if (!this.newPassword) {
      this.errorMessage = 'Please enter a new password.';
      return;
    }

    if (!this.isPasswordValid) {
      if (!this.isMatching && this.confirmPassword.length > 0) {
        this.errorMessage = 'New password and confirm password do not match.';
      } else {
        this.errorMessage = 'Please fulfil all password requirements before submitting.';
      }
      return;
    }

    this.isLoading = true;

    this.auth.changePassword(this.currentPassword, this.newPassword).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.successMessage = res.message || 'Password updated successfully. Redirecting to your dashboard...';
        setTimeout(() => {
          this.router.navigateByUrl(this.auth.homeRoute());
        }, 1500);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err?.message || 'Failed to update password. Please try again.';
      }
    });
  }
}
