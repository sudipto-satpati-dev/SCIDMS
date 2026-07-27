import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  credentials = { username: '', password: '' };
  showPassword = false;
  isLoading = false;
  errorMessage = '';

  constructor(private router: Router) {}

  onSubmit(): void {
    this.errorMessage = '';

    if (!this.credentials.username || !this.credentials.password) {
      this.errorMessage = 'Username and password are required.';
      return;
    }

    this.isLoading = true;

    // Simulate login API call
    // In production: call auth service, check isFirstTimeLogin flag from server response.
    // If server returns isFirstTimeLogin=true, redirect to change-password.
    setTimeout(() => {
      this.isLoading = false;

      // Demo: passwords ending with '!' or containing 'Temp' are treated as temporary
      const isTemporaryPassword =
        this.credentials.password.includes('Temp') ||
        this.credentials.password.endsWith('!');

      if (isTemporaryPassword) {
        // Force mandatory password change before granting dashboard access
        this.router.navigate(['/auth/change-password']);
      } else {
        this.router.navigate(['/dashboard']);
      }
    }, 800);
  }
}
