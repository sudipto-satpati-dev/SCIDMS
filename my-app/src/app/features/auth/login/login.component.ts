import { Component } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

interface DemoUser {
  role:     string;
  username: string;
  password: string;
  color:    string;
}

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  credentials  = { username: '', password: '' };
  showPassword = false;
  isLoading    = false;
  errorMessage = '';

  /** Quick-access demo accounts shown below the login form */
  readonly demoUsers: DemoUser[] = [
    { role: 'Administrator',        username: 'alex.rivera',  password: 'Admin@2026',   color: '#7c3aed' },
    { role: 'Management',           username: 'james.wright', password: 'Manage@2026',  color: '#0284c7' },
    { role: 'Warehouse Manager',    username: 'sarah.j_mgmt', password: 'Warehouse@1',  color: '#059669' },
    { role: 'Sales Executive',      username: 'ben.kline',    password: 'Sales@2026',   color: '#d97706' },
    { role: 'Distribution Manager', username: 'priya.sharma', password: 'Distrib@2026', color: '#dc2626' },
  ];

  constructor(
    private auth:   AuthService,
    private router: Router,
    private route:  ActivatedRoute,
  ) {}

  /** Fill credentials from a demo card and auto-submit */
  fillDemo(user: DemoUser): void {
    this.credentials.username = user.username;
    this.credentials.password = user.password;
    this.onSubmit();
  }

  onSubmit(): void {
    this.errorMessage = '';
    if (!this.credentials.username.trim() || !this.credentials.password.trim()) {
      this.errorMessage = 'Username and password are required.';
      return;
    }
    this.isLoading = true;

    this.auth.login(this.credentials.username, this.credentials.password).subscribe({
      next: () => {
        this.isLoading = false;
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
        this.router.navigateByUrl(returnUrl || this.auth.homeRoute());
      },
      error: (err) => {
        this.isLoading    = false;
        this.errorMessage = err?.message || 'Invalid username or password.';
      },
    });
  }
}
