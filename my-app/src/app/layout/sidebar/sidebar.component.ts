import { Component } from '@angular/core';
import { AuthService, ROLE_PERMISSIONS } from '../../core/services/auth.service';
import { User } from '../../core/models/index';

interface NavItem {
  label:  string;
  route:  string;
  role:   string;   // matches key in ROLE_PERMISSIONS
  icon:   string;   // inline SVG path data
}

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
})
export class SidebarComponent {

  constructor(public auth: AuthService) {}

  readonly navItems: NavItem[] = [
    { label: 'Dashboard',        route: '/dashboard',  role: 'dashboard',  icon: 'rect3' },
    { label: 'Products',         route: '/products',   role: 'products',   icon: 'box'   },
    { label: 'Warehouses',       route: '/warehouses', role: 'warehouses', icon: 'home'  },
    { label: 'Orders',           route: '/orders',     role: 'orders',     icon: 'cart'  },
    { label: 'Shipments',        route: '/shipments',  role: 'shipments',  icon: 'truck' },
    { label: 'User MANAGER',  route: '/users',      role: 'users',      icon: 'users' },
    { label: 'Inventory',        route: '/inventory',  role: 'inventory',  icon: 'list'  },
    { label: 'Reports',          route: '/reports',    role: 'reports',    icon: 'bar'   },
    { label: 'Audit',            route: '/audit',      role: 'audit',      icon: 'file'  },
  ];

  get visibleNavItems(): NavItem[] {
    return this.navItems.filter(item => this.auth.canAccess(item.role));
  }

  get currentUser(): User | null { return this.auth.currentUser; }

  get userInitials(): string {
    const u = this.currentUser;
    if (!u) return 'AU';
    return u.username.split(/[._]/).map(s => s[0]?.toUpperCase() || '').join('').slice(0, 2) || 'AU';
  }

  get roleLabel(): string {
    return this.currentUser?.role ?? '';
  }

  logout(): void { this.auth.logout(); }
}
