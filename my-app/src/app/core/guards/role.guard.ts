/**
 * RoleGuard — enforces BRD FR004 / BR003 RBAC at the route level.
 *
 * Usage in route config:
 *   { path: 'users', canActivate: [AuthGuard, RoleGuard], data: { role: 'users' }, ... }
 *
 * The `data.role` string matches the keys in ROLE_PERMISSIONS.
 */
import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({ providedIn: 'root' })
export class RoleGuard implements CanActivate {
  constructor(private auth: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    const required = route.data?.['role'] as string | undefined;
    if (!required || this.auth.canAccess(required)) return true;

    // BRD Exception: "You are not authorized to perform this action."
    this.router.navigate([this.auth.homeRoute()]);
    return false;
  }
}
