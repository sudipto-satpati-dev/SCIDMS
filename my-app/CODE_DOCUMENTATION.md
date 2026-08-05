# SCIDMS — Technical Codebase Documentation

This document provides a comprehensive developer specification and architectural guide for the **Smart Supply Chain Inventory and Distribution Management System (SCIDMS)** web application.

---

## 📐 1. Architectural Overview & Technical Stack

SCIDMS is built as a single-page Angular application adhering to clean architecture, feature-based modularity, and reactive programming principles, fully integrated with a production **Spring Boot** REST API backend backed by a **PostgreSQL** database.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              PRESENTATION LAYER                             │
│       TopBar          SideBar           MainLayout         Shared Views    │
└──────────────────────┬──────────────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            FEATURE MODULE LAYER                             │
│   Auth   Dashboard   Products   Warehouses   Inventory   Orders   Shipments │
└──────────────────────┬──────────────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                                CORE LAYER                                   │
│    AuthGuard    RoleGuard    AuthInterceptor    Domain Services & Models    │
└──────────────────────┬──────────────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                             DATA ACCESS LAYER                               │
│                Angular HttpClient (RxJS Observable Streams)                │
│                                      │                                      │
│                               (REST Over HTTP)                              │
│                                      ▼                                      │
│                Spring Boot REST API (Spring Security + JWT)                 │
│                                      │                                      │
│                                      ▼                                      │
│                     PostgreSQL Relational Database                          │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Core Architecture Highlights:
1. **Lazy-Loaded Modular Routing**: Each business feature (`auth`, `dashboard`, `products`, `warehouses`, `inventory`, `orders`, `shipments`, `reports`, `users`, `audit`) is encapsulated inside its own feature module and lazy-loaded via the Angular Router.
2. **Reactive RxJS Data Pipelines**: Data flows asynchronously through RxJS `Observable` streams, consuming native Angular `HttpClient` services connected directly to backend REST endpoints (`/api/...`).
3. **Production Spring Security & JWT**: Authentication is handled via Spring Security issuing JWT bearer tokens. Tokens are securely stored in local storage and attached to every outgoing HTTP request via the `AuthInterceptor`.
4. **Declarative RBAC Route Guards**: Route guards (`AuthGuard`, `RoleGuard`) enforce client-side permission checks matching role definitions, complementing server-side security authorization checks.

---

## 📁 2. File & Directory Hierarchy

```
src/app/
├── app-routing.module.ts            # Top-level routing definitions & RBAC permissions map
├── app.component.ts                 # Root container component
├── app.module.ts                    # Root Angular module declaration
│
├── core/                            # Core singletons, models, services, guards & interceptors
│   ├── core.module.ts               # Core module initializer
│   ├── guards/                      # Route guards
│   │   ├── auth.guard.ts            # Session verification & password reset redirect
│   │   └── role.guard.ts            # Role permission guard matching route metadata
│   ├── interceptors/
│   │   └── auth.interceptor.ts      # HTTP Bearer token injector & 401 error interceptor
│   ├── models/                      # Strongly-typed TypeScript domain interfaces
│   │   ├── index.ts                 # Barrel exports for domain models
│   │   ├── model.audit.ts           # Audit log entry model
│   │   ├── model.auth.ts            # Authentication request/response interfaces
│   │   ├── model.category.ts        # Product category interface
│   │   ├── model.dashboard.ts       # Analytics & KPI interfaces
│   │   ├── model.inventory.ts       # Inventory stock row & movement transaction interfaces
│   │   ├── model.order.ts           # Customer order & order item interfaces
│   │   ├── model.product.ts         # Product SKU & catalog interface
│   │   ├── model.shipment.ts        # Logistics shipment & delivery interfaces
│   │   ├── model.user.ts            # User account & RBAC role types
│   │   └── model.warehouse.ts       # Warehouse facility & capacity interfaces
│   └── services/                    # Business services consuming Spring Boot REST API
│       ├── audit.service.ts         # System audit trail service (/api/audit)
│       ├── auth.service.ts          # Authentication & session service (/api/auth)
│       ├── category.service.ts      # Category CRUD service (/api/categories)
│       ├── dashboard.service.ts     # Executive analytics service (/api/dashboard)
│       ├── inventory.service.ts     # Stock receive, dispatch & transfer service (/api/inventory)
│       ├── order.service.ts         # Order placement & approval service (/api/orders)
│       ├── product.service.ts       # Product catalog management service (/api/products)
│       ├── shipment.service.ts      # Distribution & delivery tracking service (/api/shipments)
│       ├── user.service.ts          # User management service (/api/users)
│       └── warehouse.service.ts     # Warehouse facility service (/api/warehouses)
│
├── layout/                          # Global navigation shell & container layouts
│   ├── layout.module.ts             # Layout module declaration
│   ├── main-layout/                 # Primary workspace layout wrapper
│   ├── sidebar/                     # Dynamic RBAC-filtered navigation drawer
│   └── topbar/                      # Header navigation, user badge & quick action launcher
│
├── shared/                          # Reusable UI controls and widgets
│   ├── shared.module.ts             # Shared module declarations
│   └── components/
│       ├── table-search-popover/    # Reusable inline column search popover
│       └── table-sort/              # Dynamic clickable column header sorter
│
└── features/                        # Lazy-loaded feature modules
    ├── audit/                       # System audit logs module
    ├── auth/                        # Login & mandatory password change views
    ├── dashboard/                   # Executive analytics & operational KPIs
    ├── inventory/                   # Stock receipt, dispatch, transfer, history & alerts
    ├── orders/                      # Order creation, validation & approval views
    ├── products/                    # Product catalog management & category modal
    ├── reports/                     # Business intelligence reports & PDF/Excel exports
    ├── shipments/                   # Delivery dispatch, tracking & verification view
    ├── users/                       # User creation & role management view
    └── warehouses/                  # Multi-warehouse listing & capacity gauge view
```

---

## 🛠️ 3. Technical Specification of Core Services & Infrastructure

### 🛡️ 3.1 Guards & Interceptors

#### 1. `AuthGuard` (`src/app/core/guards/auth.guard.ts`)
- **Purpose**: Verifies that navigating users possess an active JWT session before loading protected routes.
- **Key Logic**:
  - Checks `AuthService.isLoggedIn`.
  - If authenticated but `user.hasChangedPassword === false`, forces immediate redirection to `/auth/change-password`.
  - If unauthenticated, stores the attempted target URL (`state.url`) in query parameter `returnUrl` and routes to `/auth/login`.

#### 2. `RoleGuard` (`src/app/core/guards/role.guard.ts`)
- **Purpose**: Enforces granular Role-Based Access Control (RBAC) at the route transition level.
- **Key Logic**:
  - Checks required module permission key from `route.data['role']`.
  - Calls `AuthService.canAccess(requiredRole)`.
  - If permitted, grants access; otherwise cancels navigation and routes user to their role landing page (`AuthService.homeRoute()`).

#### 3. `AuthInterceptor` (`src/app/core/interceptors/auth.interceptor.ts`)
- **Purpose**: Automatic JWT Bearer token injection and HTTP 401/403 error catching.
- **Key Logic**:
  - Retrieves active token from `AuthService.token`.
  - Clones outgoing `HttpRequest` and injects `Authorization: Bearer <token>` header.
  - Catches `HttpErrorResponse` (401 Unauthorized), clears local session, and redirects user to `/auth/login`.

---

### 🔑 3.2 Authentication & Session Management (`AuthService`)

Located in `src/app/core/services/auth.service.ts`, `AuthService` handles authentication network requests and role definitions:

```typescript
export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  'ADMIN':                ['dashboard', 'products', 'warehouses', 'inventory', 'orders', 'shipments', 'reports', 'audit', 'users'],
  'MANAGER':              ['dashboard', 'products', 'warehouses', 'inventory', 'orders', 'shipments', 'reports', 'audit'],
  'WAREHOUSE MANAGER':    ['dashboard', 'products', 'warehouses', 'inventory', 'reports'],
  'SALES EXECUTIVE':      ['dashboard', 'products', 'orders', 'reports'],
  'DISTRIBUTION MANAGER': ['dashboard', 'products', 'orders', 'shipments', 'reports'],
  'PRODUCT MANAGER':      ['dashboard', 'products', 'reports'],
};
```

#### Core API Methods:
- `login(usernameOrEmail, password): Observable<User>`: Executes HTTP POST to `${environment.apiBaseUrl}/api/auth/login`, receives JWT token & user payload, stores session token in `localStorage`, and updates active user state.
- `logout(): void`: Clears local session storage and navigates to `/auth/login`.
- `canAccess(moduleName: string): boolean`: Validates if active role has permission to access the target module string.
- `changePassword(oldPassword, newPassword): Observable<void>`: Executes HTTP POST to `${environment.apiBaseUrl}/api/auth/change-password` and updates `hasChangedPassword` state to `true`.

---

### 💾 3.3 Domain Models Specification (`src/app/core/models/`)

| Model File | Key Interfaces | Description |
| :--- | :--- | :--- |
| `model.user.ts` | `User`, `UserRole`, `CreateUserRequest` | User entity schema, role enumeration, account status (`Active`/`Inactive`). |
| `model.product.ts` | `Product`, `CreateProductRequest` | Product schema containing SKU, barcode, unit price, stock threshold, and dimensions. |
| `model.warehouse.ts` | `Warehouse`, `WarehouseCapacity` | Warehouse entity, facility manager, location, total capacity, and used storage volume. |
| `model.inventory.ts` | `InventoryRow`, `InventoryTransaction`, `StockReceiveRequest`, `StockDispatchRequest`, `StockTransferRequest` | Itemized stock records, transactional history, receive/dispatch payloads. |
| `model.order.ts` | `Order`, `OrderItem`, `OrderStatus`, `CreateOrderRequest` | Customer order entity, line items, and approval status lifecycle (`APPROVED`, `PENDING`, etc.). |
| `model.shipment.ts` | `Shipment`, `ShipmentItem`, `ShipmentStatus`, `CreateShipmentRequest` | Shipment tracking details, carrier, verification codes, and logistics status. |
| `model.audit.ts` | `AuditLog`, `AuditAction`, `AuditModule` | Operational audit record capturing actor IDs, IP addresses, timestamp, and modification payload. |
| `model.dashboard.ts` | `DashboardStats`, `KPICard` | Aggregated backend statistics schema powering operational overview. |

---

### ⚙️ 3.4 REST API Service Architecture (`src/app/core/services/`)

All domain services interact with Spring Boot REST endpoints using Angular's native `HttpClient`:

| Domain Service | Primary REST Endpoints | Description |
| :--- | :--- | :--- |
| `InventoryService` | `POST /api/inventory/receive`<br>`POST /api/inventory/dispatch`<br>`POST /api/inventory/transfer`<br>`GET /api/inventory/history` | Handles stock receipts, outbound dispatches, inter-warehouse transfers, stock history ledger, and low-stock alerts. |
| `OrderService` | `GET /api/orders`<br>`POST /api/orders`<br>`POST /api/orders/{id}/approve`<br>`POST /api/orders/{id}/reject` | Handles order creation, inventory allocation validation, and order approval/rejection workflows. |
| `ShipmentService` | `GET /api/shipments`<br>`POST /api/shipments`<br>`POST /api/shipments/verify-delivery` | Manages shipment creation, carrier assignment, tracking, and public delivery verification. |
| `ProductService` | `GET /api/products`<br>`POST /api/products`<br>`PUT /api/products/{id}`<br>`DELETE /api/products/{id}` | Product catalog management and category assignment. |
| `WarehouseService` | `GET /api/warehouses`<br>`POST /api/warehouses`<br>`PUT /api/warehouses/{id}` | Warehouse facility registration, manager assignment, and capacity calculation. |
| `UserService` | `GET /api/users`<br>`POST /api/users`<br>`PUT /api/users/{id}/status` | Admin user account creation, role assignment, and status toggling (`Active`/`Inactive`). |
| `AuditService` | `GET /api/audit` | Querying compliance audit logs filtered by actor, date range, or module. |
| `DashboardService` | `GET /api/dashboard/stats` | Aggregating top-level KPI metrics and system summary cards. |

---

## 🎨 4. Layout Shell & Shared UI Components

### 🖥️ 4.1 Layout Shell (`src/app/layout/`)
- **MainLayoutComponent** (`main-layout.component.ts`): Host view containing the persistent top bar and left navigation sidebar surrounding a `<router-outlet>`.
- **TopbarComponent** (`topbar.component.ts`): Displays logged-in user profile, active role badge, Quick Action launcher (Order, Receipt, Product creation), and session logout button.
- **SidebarComponent** (`sidebar.component.ts`): Dynamically builds navigation items filtered by `AuthService.canAccess()`.

---

### 🧩 4.2 Shared Components (`src/app/shared/components/`)

#### 1. `TableSortComponent` (`table-sort.component.ts`)
- Renders clickable column headers with visual sort indicators (`▲`/`▼`) for multi-attribute table sorting.

#### 2. `TableSearchPopoverComponent` (`table-search-popover.component.ts`)
- Inline search popover allowing instant column-level dataset filtering.

---

## 📦 5. Feature Modules Specification

### 1. `AuthModule` (`src/app/features/auth/`)
- **LoginComponent**: Credentials form communicating with `POST /api/auth/login`.
- **ChangePasswordComponent**: Mandatory password change view for new accounts (`POST /api/auth/change-password`).

### 2. `DashboardModule` (`src/app/features/dashboard/`)
- **DashboardOverviewComponent**: Operational dashboard consuming `/api/dashboard/stats` to render real-time KPI tiles, low-stock warnings, and pending approvals.

### 3. `ProductsModule` (`src/app/features/products/`)
- **ProductListComponent & ProductFormComponent**: Product catalog CRUD interface connected to `/api/products`.
- **CategoryModalComponent**: Quick category management popup (`/api/categories`).

### 4. `WarehousesModule` (`src/app/features/warehouses/`)
- **WarehouseListComponent & WarehouseCapacityComponent**: Facility listing and visual storage capacity utilization gauge (`/api/warehouses`).

### 5. `InventoryModule` (`src/app/features/inventory/`)
- **WarehouseStockComponent**, **StockReceiveComponent**, **StockDispatchComponent**, **StockTransferComponent**, **InventoryHistoryComponent**, **LowStockAlertsComponent**: Real-time inventory operational forms connected to backend transaction endpoints (`/api/inventory/*`).

### 6. `OrdersModule` (`src/app/features/orders/`)
- **OrderListComponent**, **OrderCreateComponent**, **OrderDetailComponent**: Order lifecycle controls connected to `/api/orders`. Approving an order automatically triggers backend stock reservation.

### 7. `ShipmentsModule` (`src/app/features/shipments/`)
- **ShipmentListComponent**, **ShipmentCreateComponent**, **ShipmentDetailComponent**, **DeliveryVerifyComponent**: Logistics controls and public delivery pin verification (`/api/shipments/*`).

### 8. `ReportsModule` (`src/app/features/reports/`)
- **ReportsDashboardComponent**: Summary reports with built-in **PDF** and **Excel** export functionality (`/api/reports`).

### 9. `UsersModule` (`src/app/features/users/`)
- **UserListComponent & UserFormComponent**: Restricted to `ADMIN` role. User creation and account status management (`/api/users`).

### 10. `AuditModule` (`src/app/features/audit/`)
- **AuditListComponent**: Audit trail ledger displaying timestamped system actions, actor identities, IP addresses, and payload diffs (`/api/audit`).

---

## ⚡ 6. Business Rules & Data Integrity Validation

| BR Code | Rule Description | Enforced Location | Implementation Mechanism |
| :--- | :--- | :--- | :--- |
| **BR001** | Unique SKU Code Constraint | Product Service & Spring Boot Backend | Backend database index & API validation prevent duplicate SKU registration. |
| **BR002** | Automated Stock Allocation | Order Approval API (`/api/orders/{id}/approve`) | Backend transactional method deducts and reserves stock across line items automatically upon approval. |
| **BR003** | Strict Role Access Control | `RoleGuard`, `SidebarComponent` | Blocks unauthorized route access client-side and enforces Spring Security authorization server-side. |
| **BR004** | JWT Session & Bearer Injection | `AuthInterceptor`, `AuthService` | Attaches Bearer authorization token on all HTTP requests; clears session on 401 response. |
| **BR005** | Warehouse Capacity Limit | Inventory Service (`/api/inventory/receive`) | Server-side check ensures inbound quantity does not exceed warehouse available capacity. |
| **BR006** | Digital Delivery Code Validation | `DeliveryVerifyComponent` (`/api/shipments/verify-delivery`) | Validates 6-digit delivery code before transitioning shipment status to `DELIVERED`. |
| **BR007** | Automatic Audit Logging | Spring Boot AOP / `AuditService` | All backend CRUD mutations automatically generate timestamped compliance log entries. |

---

## 🌐 7. Environment Configuration

The application environment settings are configured in `src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  apiBaseUrl: 'http://localhost:8080'  // Spring Boot REST API endpoint
};
```
