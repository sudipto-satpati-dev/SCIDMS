import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';

const routes: Routes = [
  // Auth routes (no layout)
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.module').then(m => m.AuthModule)
  },
  // Protected routes (inside main layout)
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadChildren: () => import('./features/dashboard/dashboard.module').then(m => m.DashboardModule)
      },
      {
        path: 'users',
        loadChildren: () => import('./features/users/users.module').then(m => m.UsersModule)
      },
      {
        path: 'products',
        loadChildren: () => import('./features/products/products.module').then(m => m.ProductsModule)
      },
      {
        path: 'warehouses',
        loadChildren: () => import('./features/warehouses/warehouses.module').then(m => m.WarehousesModule)
      },
      {
        path: 'inventory',
        loadChildren: () => import('./features/inventory/inventory.module').then(m => m.InventoryModule)
      },
      {
        path: 'orders',
        loadChildren: () => import('./features/orders/orders.module').then(m => m.OrdersModule)
      },
      {
        path: 'shipments',
        loadChildren: () => import('./features/shipments/shipments.module').then(m => m.ShipmentsModule)
      },
      {
        path: 'reports',
        loadChildren: () => import('./features/reports/reports.module').then(m => m.ReportsModule)
      },
      {
        path: 'audit',
        loadChildren: () => import('./features/audit/audit.module').then(m => m.AuditModule)
      }
    ]
  },
  { path: '**', redirectTo: 'auth/login' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
