import { Component } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  // Accepts username or email — matches usernameOrEmail field in the API
  credentials  = { usernameOrEmail: '', password: '' };
  showPassword = false;
  isLoading    = false;
  errorMessage = '';

  constructor(
    private auth:   AuthService,
    private router: Router,
    private route:  ActivatedRoute,
  ) {}

  onSubmit(): void {
    this.errorMessage = '';

    if (!this.credentials.usernameOrEmail.trim() || !this.credentials.password.trim()) {
      this.errorMessage = 'Username/email and password are required.';
      return;
    }

    this.isLoading = true;

    this.auth
      .login(this.credentials.usernameOrEmail.trim(), this.credentials.password)
      .subscribe({
        next: (user) => {
          this.isLoading = false;
          if (user.hasChangedPassword === false) {
            this.router.navigate(['/auth/change-password']);
          } else {
            const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
            this.router.navigateByUrl(returnUrl ?? this.auth.homeRoute());
          }
        },
        error: (err) => {
          this.isLoading    = false;
          this.errorMessage = err?.message ?? 'Invalid username or password.';
        },
      });
  }
}
