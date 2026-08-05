# SCIDMS — Smart Supply Chain Inventory and Distribution Management System

![Angular 14](https://img.shields.io/badge/Angular-14.2-dd0031?style=for-the-badge&logo=angular)
![TypeScript](https://img.shields.io/badge/TypeScript-4.7-3178c6?style=for-the-badge&logo=typescript)
![RxJS](https://img.shields.io/badge/RxJS-7.5-b7178c?style=for-the-badge&logo=reactivex)
![Spring Boot](https://img.shields.io/badge/Spring_Boot-2.7-6DB33F?style=for-the-badge&logo=springboot)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14-4169E1?style=for-the-badge&logo=postgresql)
![SCSS](https://img.shields.io/badge/SCSS-Vanilla-c69?style=for-the-badge&logo=sass)

---

## 📌 Executive Summary

**SCIDMS** (Smart Supply Chain Inventory and Distribution Management System) is a fully implemented, enterprise-grade web application designed to streamline multi-warehouse inventory tracking, order fulfillment, shipment logistics, and role-based operational audits.

The application features an **Angular 14** single-page frontend seamlessly integrated with a live **Spring Boot** REST API backend backed by a **PostgreSQL** database. SCIDMS provides real-time visibility across product catalogs, warehouse capacity metrics, stock movements (receipt, dispatch, inter-warehouse transfers), order approvals, delivery verification, and compliance audit logging.

---

## ✨ Key Features & Functional Modules

### 🔐 1. Authentication, Authorization & Security
- **Production JWT Authentication**: Live authentication flow connecting to `/api/auth/login`. JWT tokens are stored securely in local storage and injected into HTTP headers via an Angular HTTP Interceptor.
- **6-Tier Role-Based Access Control (RBAC)**: Enforced across 6 user roles (`ADMIN`, `MANAGER`, `WAREHOUSE MANAGER`, `SALES EXECUTIVE`, `DISTRIBUTION MANAGER`, `PRODUCT MANAGER`).
- **Mandatory Password Renewal**: Forced password updates (`hasChangedPassword`) upon initial user login via `/api/auth/change-password`.
- **Declarative Route Guards**: Protected by `AuthGuard` (session/token verification) and `RoleGuard` (RBAC route metadata checking).

### 📊 2. Operational Dashboard & Real-Time Analytics
- **Live KPI Summary**: Real-time aggregated stats fetched directly from `/api/dashboard/stats` (Total Products, Capacity Occupancy %, Pending Orders, Active Shipments, Low-Stock Warnings).
- **Low-Stock Alerts Panel**: Instant visual alerts for stock items falling below critical reorder limits.
- **Recent Activity Stream**: Live feed of dispatches, stock receipts, and recent order submissions.

### 📦 3. Product Catalog & Category Management
- **Full RESTful Product Management**: Full CRUD operations integrated with backend REST APIs (`/api/products`).
- **Category Hierarchy**: Category creation and assignment via `/api/categories`.
- **Advanced Filtering & Sorting**: Multi-attribute sorting and column search popovers.

### 🏭 4. Warehouse & Capacity Monitoring
- **Multi-Warehouse Tracking**: Monitor physical warehouse locations, assigned managers, contact metrics, and total capacity limits via `/api/warehouses`.
- **Capacity Utilization Gauge**: Real-time percentage visualization of occupied vs available storage capacity.

### 🔄 5. Inventory Control & Stock Movements
- **Stock Receipt**: Record incoming stock shipments directly into designated warehouses with backend batch tracking (`/api/inventory/receive`).
- **Stock Dispatch**: Dispatch stock against validated orders with backend inventory deduction safeguards (`/api/inventory/dispatch`).
- **Inter-Warehouse Transfer**: Execute stock transfers between facilities with origin availability checks and target capacity validation (`/api/inventory/transfer`).
- **Stock Movement Ledger**: Complete historical record of stock transactions with transaction IDs, timestamps, and actor tracking (`/api/inventory/history`).

### 🛍️ 6. Order Processing & Fulfillment
- **Order Creation**: Create multi-item orders with dynamic price calculations and live backend inventory validation (`/api/orders`).
- **Approval Workflow**: Multi-stage status lifecycle (`PENDING`, `APPROVED`, `REJECTED`, `SHIPPED`, `DELIVERED`, `CANCELLED`).
- **Automated Stock Reservation**: Order approval triggers automated backend stock reservation across specified line items.

### 🚚 7. Shipment & Distribution Logistics
- **Shipment Generation**: Convert approved orders into official shipments with tracking numbers, carrier details, and estimated delivery dates (`/api/shipments`).
- **Public Delivery Verification**: Publicly accessible verification interface (`/delivery-verify/:id`) supporting digital delivery code validation via `/api/shipments/verify-delivery`.
- **Shipment Lifecycle**: Track shipments through `PREPARING`, `IN_TRANSIT`, `DELIVERED`, `FAILED`, or `RETURNED`.

### 📈 8. Business Intelligence & Reports
- **Interactive Analytics**: Detailed summary reports for Inventory Valuation, Order Performance, and Shipment Metrics via `/api/reports`.
- **Data Export**: Built-in export tools for generating **PDF** and **Excel** reports.

### 🛡️ 9. System Audit & Compliance Logs
- **System Audit Trail**: Complete backend-driven compliance log (`/api/audit`) tracking all CRUD operations, authentication events, and transactions.
- **Security Monitoring**: Captured IP addresses, timestamps, actor details, and operational payload diffs.

---

## 👥 Role-Based Access Control (RBAC) Matrix

| Module | Administrator | Manager | Warehouse Manager | Sales Executive | Distribution Manager | Product Manager |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Dashboard** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Products** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Warehouses** | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Inventory** | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Orders** | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ |
| **Shipments** | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| **Reports** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Audit Logs** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **User Management** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

---

## 🛠️ Technology Stack & Architecture

- **Frontend Framework**: [Angular 14.2](https://angular.io/)
- **Programming Language**: [TypeScript 4.7](https://www.typescriptlang.org/)
- **Reactive Programming**: [RxJS 7.5](https://rxjs.dev/)
- **Backend Framework**: [Spring Boot 2.7](https://spring.io/projects/spring-boot) (Java 17)
- **Database**: [PostgreSQL 14](https://www.postgresql.org/)
- **Authentication**: Spring Security with JWT (JSON Web Tokens)
- **Styling**: Vanilla SCSS (CSS3 variables, Flexbox, Grid)
- **HTTP Client**: Native Angular `HttpClient` consuming backend REST APIs (`http://localhost:8080/api`)

---

## 📁 Repository Structure

```
SCIDMS/
└── my-app/
    ├── src/
    │   ├── app/
    │   │   ├── core/                  # Core infrastructure, services, models, guards & interceptors
    │   │   │   ├── guards/            # AuthGuard & RoleGuard
    │   │   │   ├── interceptors/      # AuthInterceptor (JWT Bearer token header injection)
    │   │   │   ├── models/            # TypeScript domain interfaces (User, Product, Order, etc.)
    │   │   │   └── services/          # HttpClient services communicating with Spring Boot REST API
    │   │   ├── features/              # Lazy-loaded feature modules
    │   │   │   ├── audit/             # System audit logs module
    │   │   │   ├── auth/              # Login & change password components
    │   │   │   ├── dashboard/         # Real-time analytics dashboard
    │   │   │   ├── inventory/         # Stock receive, dispatch, transfer & history
    │   │   │   ├── orders/            # Order creation & approval workflow
    │   │   │   ├── products/          # Product catalog & category management
    │   │   │   ├── reports/           # Business intelligence & PDF/Excel export
    │   │   │   ├── shipments/         # Logistics tracking & public delivery verification
    │   │   │   ├── users/             # User account management (Admin)
    │   │   │   └── warehouses/        # Multi-warehouse management & capacity gauge
    │   │   ├── layout/                # Global layout shell, topbar & dynamic sidebar
    │   │   │   ├── main-layout/
    │   │   │   ├── sidebar/
    │   │   │   └── topbar/
    │   │   ├── shared/                # Reusable UI components (TableSort, SearchPopover)
    │   │   ├── app-routing.module.ts  # Master routing & RBAC permission configuration
    │   │   └── app.module.ts          # Root module definition
    │   ├── assets/                    # Static assets & icons
    │   ├── environments/              # Environment configurations (`apiBaseUrl`)
    │   └── styles.scss                # Global SCSS theme & styling tokens
    ├── angular.json                   # Angular workspace settings
    ├── package.json                   # Project dependencies & scripts
    └── tsconfig.json                  # TypeScript compiler configuration
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: `v16.x` or `v18.x` (Recommended: Node 18 LTS)
- **npm**: `v8.x` or higher
- **Angular CLI**: `v14.2.13` (`npm install -g @angular/cli@14.2.13`)
- **Backend API**: Running Spring Boot backend server on `http://localhost:8080` with PostgreSQL database.

---

### Installation & Execution

1. **Clone the repository**:
   ```bash
   git clone https://github.com/sudipto-satpati-dev/SCIDMS.git
   cd SCIDMS/my-app
   ```

2. **Install project dependencies**:
   ```bash
   npm install
   ```

3. **Verify API Configuration**:
   Ensure `src/environments/environment.ts` points to your Spring Boot REST server:
   ```typescript
   export const environment = {
     production: false,
     apiBaseUrl: 'http://localhost:8080'
   };
   ```

4. **Start the local development server**:
   ```bash
   npm start
   # or
   ng serve
   ```

5. **Access the application**:
   Open browser at `http://localhost:4200/`.

---

## 🔑 Default System User Accounts (Database Seed)

The following pre-configured accounts are available in the system backend database:

| Role | Username / Email | Default Password | Default Landing Page |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin` / `admin@scidms.com` | `Admin123!` | `/dashboard` |
| **Manager** | `manager` / `manager@scidms.com` | `Manager123!` | `/dashboard` |
| **Warehouse Manager** | `wmanager` / `wmanager@scidms.com` | `Wmanager123!` | `/inventory` |
| **Sales Executive** | `salesexec` / `salesexec@scidms.com` | `Sales123!` | `/orders` |
| **Distribution Manager** | `distmanager` / `distmanager@scidms.com` | `Dist123!` | `/shipments` |
| **Product Manager** | `prodmanager` / `prodmanager@scidms.com` | `Prod123!` | `/products` |

---

## ⚙️ CLI Command Summary

| Command | Action |
| :--- | :--- |
| `npm start` | Runs Angular dev server at `http://localhost:4200/` with hot-reloading. |
| `npm run build` | Builds optimized production artifacts into `dist/my-app/`. |
| `npm test` | Executes unit test suites via Karma / Jasmine. |

---

## 📄 License & Attribution

Developed as part of the **SCIDMS Supply Chain Ecosystem**. All rights reserved.
