/**
 * AuthGuard — redirects unauthenticated users to login (FR002 / BR004).
 * MIGRATION: When using real JWT, this guard stays identical.
 * The token expiry check in the interceptor handles expired sessions separately.
 */
import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(private auth: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    if (this.auth.isLoggedIn) {
      if (this.auth.currentUser?.hasChangedPassword === false) {
        this.router.navigate(['/auth/change-password']);
        return false;
      }
      return true;
    }
    // Store attempted URL so we can redirect back after login
    this.router.navigate(['/auth/login'], { queryParams: { returnUrl: state.url } });
    return false;
  }
}
 