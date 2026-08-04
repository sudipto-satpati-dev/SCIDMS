import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';
import { AuthGuard } from './core/guards/auth.guard';
import { RoleGuard } from './core/guards/role.guard';

import { DeliveryVerifyComponent } from './features/shipments/delivery-verify/delivery-verify.component';

const routes: Routes = [
  // ── Public routes (no layout, no guard) ──────────────────────────────────
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.module').then(m => m.AuthModule),
  },
  {
    path: 'delivery-verify/:id',
    component: DeliveryVerifyComponent,
  },

  // ── Protected routes (inside main layout) ────────────────────────────────
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [AuthGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },

      // ALL roles
      {
        path: 'dashboard',
        canActivate: [RoleGuard],
        data: { role: 'dashboard' },
        loadChildren: () => import('./features/dashboard/dashboard.module').then(m => m.DashboardModule),
      },

      // Administrator only
      {
        path: 'users',
        canActivate: [RoleGuard],
        data: { role: 'users' },
        loadChildren: () => import('./features/users/users.module').then(m => m.UsersModule),
      },

      // Administrator, MANAGER, WAREHOUSE MANAGER, SALES EXECUTIVE, DISTRIBUTION MANAGER, PRODUCT MANAGER
      {
        path: 'products',
        canActivate: [RoleGuard],
        data: { role: 'products' },
        loadChildren: () => import('./features/products/products.module').then(m => m.ProductsModule),
      },

      // Administrator, MANAGER, WAREHOUSE MANAGER
      {
        path: 'warehouses',
        canActivate: [RoleGuard],
        data: { role: 'warehouses' },
        loadChildren: () => import('./features/warehouses/warehouses.module').then(m => m.WarehousesModule),
      },

      // Administrator, MANAGER, WAREHOUSE MANAGER
      {
        path: 'inventory',
        canActivate: [RoleGuard],
        data: { role: 'inventory' },
        loadChildren: () => import('./features/inventory/inventory.module').then(m => m.InventoryModule),
      },

      // Administrator, MANAGER, SALES EXECUTIVE, DISTRIBUTION MANAGER
      {
        path: 'orders',
        canActivate: [RoleGuard],
        data: { role: 'orders' },
        loadChildren: () => import('./features/orders/orders.module').then(m => m.OrdersModule),
      },

      // Administrator, MANAGER, DISTRIBUTION MANAGER
      {
        path: 'shipments',
        canActivate: [RoleGuard],
        data: { role: 'shipments' },
        loadChildren: () => import('./features/shipments/shipments.module').then(m => m.ShipmentsModule),
      },

      // Administrator, MANAGER, WAREHOUSE MANAGER, SALES EXECUTIVE, DISTRIBUTION MANAGER, PRODUCT MANAGER
      {
        path: 'reports',
        canActivate: [RoleGuard],
        data: { role: 'reports' },
        loadChildren: () => import('./features/reports/reports.module').then(m => m.ReportsModule),
      },

      // Administrator, MANAGER
      {
        path: 'audit',
        canActivate: [RoleGuard],
        data: { role: 'audit' },
        loadChildren: () => import('./features/audit/audit.module').then(m => m.AuditModule),
      },
    ],
  },

  // Catch-all
  { path: '**', redirectTo: 'auth/login' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
