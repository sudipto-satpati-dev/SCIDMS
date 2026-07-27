import { Component } from '@angular/core';
import { Router } from '@angular/router';

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

  constructor(private router: Router) {}

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

    // TODO: wire up auth service — POST to /api/auth/change-password
    // Body: { currentPassword, newPassword }
    // On success: clear session flag isFirstTimeLogin, redirect to dashboard
    setTimeout(() => {
      this.isLoading = false;
      this.successMessage = 'Password updated successfully. Redirecting to your dashboard...';
      setTimeout(() => {
        this.router.navigate(['/dashboard']);
      }, 1800);
    }, 900);
  }
}
