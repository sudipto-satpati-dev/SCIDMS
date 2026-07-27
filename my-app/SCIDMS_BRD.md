# SCIDMS — Business Requirements Document

**SCIDMS | Version 1.1 | July 2026**

> Note: This markdown was transcribed from screenshots of the source Google Doc. 
> A few lines were cropped at the right edge of the screen in the source images — 
> those have been reconstructed from context and are marked with `[…]`. Please 
> cross-check the marked lines against your original doc. Section 4 (Business 
> Drivers), 7.1 (Priority Rating scale), and 13 (Audit and Traceability 
> Requirements) were not fully visible in the source screenshots and are included 
> only as headings, or partially, below.

---

## (Objectives, continued)
- Ensure secure, traceable and recoverable business transactions.

---

## 3. Project Scope

### 3.1 In Scope

**Inventory Management**
- Product management
- Inventory tracking and stock updates
- Stock receipt and dispatch
- Inter-warehouse transfer
- Low-stock alerts and transaction history

**Warehouse Management**
- Warehouse creation and maintenance
- Capacity monitoring
- Inventory allocation

**Order Management**
- Order creation
- Inventory validation and allocation
- Approval, rejection, status tracking and cancellation

**Distribution and Shipment Management**
- Shipment creation
- Dispatch processing
- Delivery tracking
- Delivery failure, return and history

**Dashboard and Reporting**
- Inventory, order and shipment reports
- Operational KPIs and drill-down views
- PDF/Excel export

**Authentication, Authorization and Audit**
- User registration and login
- JWT-based authentication
- RBAC
- Audit trail and unauthorized-access logging

**Operational Controls**
- Exception handling
- Database transactions and rollback
- Backup and recovery
- Data reconciliation

### 3.2 Out of Scope
- Real-time GPS tracking
- AI-based demand forecasting
- Vendor procurement management
- Payment processing
- ERP integration
- Mobile application development

> The MVP is implemented using Angular, Spring Boot and PostgreSQL and is intended 
> for a controlled academic or demonstration environment.

---

## 4. Business Drivers
*(Content not fully captured in source screenshots — please refer to the original doc.)*

---

## 6. Proposed Process

The proposed process uses a centralized application to validate, authorize and record each business transaction.

```
User Login
   ↓
Product and Inventory Management
   ↓
Order Creation
   ↓
Inventory Validation
   ↓
Order Approval or Rejection
   ↓
Inventory Allocation
   ↓
Shipment Creation
   ↓
Dispatch and Delivery Tracking
   ↓
Dashboard, Reports and Audit Review
```

---

## 7. Functional Requirements

| ID | Requirement | Priority | Raised By |
|---|---|---|---|
| FR001 | User Registration | High | Administrator |
| FR002 | Secure User Login | Critical | Administrator |
| FR003 | JWT-based Authentication | Critical | Administrator |
| FR004 | Role-Based Access Control | Critical | Administrator |
| FR005 | User Management | High | Administrator |
| FR006 | Product Management | High | Administrator |
| FR007 | Product Inventory Tracking | High | Warehouse Manager |
| FR008 | Warehouse Creation | High | Administrator |
| FR009 | Warehouse Capacity Monitoring | Medium | Warehouse Manager |
| FR010 | Inventory Allocation | High | Warehouse Manager |
| FR011 | Stock Receiving | High | Warehouse Manager |
| FR012 | Stock Dispatch | High | Warehouse Manager |
| FR013 | Warehouse Stock Transfer | Medium | Warehouse Manager |
| FR014 | Low-Stock Alerts | High | Warehouse Manager |
| FR015 | Inventory History Tracking | Medium | Warehouse Manager |
| FR016 | Customer Order Creation | Critical | Sales Executive |
| FR017 | Order Approval | High | Management |
| FR018 | Order Status Tracking | High | Sales Executive |
| FR019 | Order Cancellation | Medium | Sales Executive |
| FR020 | Shipment Creation | Critical | Distribution Manager |
| FR021 | Shipment Status Management | High | Distribution Manager |
| FR022 | Shipment Tracking | High | Distribution Manager |
| FR023 | Dashboard Monitoring | High | Management |
| FR024 | Inventory Reporting | Medium | Management |
| FR025 | Order Reporting | Medium | Management |
| FR026 | Shipment Reporting and Export | Medium | Management |
| FR027 | Exception Handling and User Error Messages | Critical | Project Team |
| FR028 | Order Rejection and Rejection Reason | High | Management |
| FR029 | Delivery Failure and Return Processing | High | Distribution Manager |
| FR030 | Duplicate Transaction Prevention | High | Project Team |
| FR031 | Audit Trail and Change History | Critical | Administrator |
| FR032 | Transaction Reconciliation | High | Warehouse Manager |
| FR033 | KPI Calculation and Dashboard Drill-Down | High | Management |
| FR034 | Backup and Recovery | High | Administrator |

### 7.1 Priority Rating
*(Scale/legend not fully captured in source screenshots — please refer to the original doc.)*

---

## 8. Business Rules and Validation Requirements

| Rule ID | Business Rule | Validation / Expected Behaviour |
|---|---|---|
| BR001 | Unique User Account | Username and email must be unique. |
| BR002 | Password Validation | Minimum eight characters with uppercase, number and special character. |
| BR003 | Role Access | Only permitted functions are accessible to each role. |
| BR004 | JWT Validation | Protected APIs require a valid, unexpired JWT. |
| BR005 | Product Validation | Name, category, price, status and threshold are mandatory. |
| BR006 | Price Validation | Unit price must be greater than zero. |
| BR007 | Quantity Validation | Inventory quantity cannot be negative. |
| BR008 | Warehouse Capacity | Receipt or transfer must not exceed available capacity. |
| BR009 | Stock Availability | Allocation, dispatch or transfer cannot exceed available inventory. |
| BR010 | Warehouse Transfer | Source and destination must be different and active. |
| BR011 | Order Validation | Valid customer data and at least one positive-quantity item are required. |
| BR012 | Duplicate Order Prevention | Repeated client request references must not create another order. |
| BR013 | Order Approval | Only authorized users may approve or reject. |
| BR014 | Order Rejection | A rejection reason is mandatory. |
| BR015 | Order Cancellation | Allowed only before shipment creation or dispatch. |
| BR016 | Inventory Allocation | Stock must be validated and reserved before fulfilment. |
| BR017 | Shipment Creation | Only an approved order with allocated stock is eligible. |
| BR018 | Shipment Transition | Created → Ready for Dispatch → In Transit → Delivered/Returned. |
| BR019 | Delivery Failure | Failure reason and next recovery status are mandatory. |
| BR020 | Audit Recording | Record actor, time, action, old/new values and reason. |
| BR021 | Soft Deletion | Referenced records shall be deactivated, not hard deleted. |
| BR022 | Transaction Consistency | Multi-record updates commit fully or roll back fully. |
| BR023 | Low-Stock Threshold | Alert when available quantity is at or below threshold. |
| BR024 | Report Access | Reports available only to authorized roles. |
| BR025 | Date Validation | Report start date cannot be after end date. |

---

## 9. Acceptance Criteria Catalogue

| FR ID | Requirement | Given-When-Then Acceptance Criteria |
|---|---|---|
| FR001 | User Registration | Given unique valid details, when submitted, then create the account; reject duplicate username or email. |
| FR002 | Secure Login | Given valid credentials, when login occurs, then authenticate and redirect; otherwise show a generic error. |
| FR003 | JWT Authentication | Given a valid token, allow protected APIs; reject invalid or expired tokens. |
| FR004 | RBAC | Given an authenticated user, allow only functions assigned to the role. |
| FR005 | User Management | Admin changes are saved and audited. |
| FR006 | Product Management | Valid products receive a unique ID; invalid or incomplete records are rejected. |
| FR007 | Inventory Tracking | Display available, allocated and warehouse-wise quantities. |
| FR008 | Warehouse Creation | Valid details and positive capacity create a unique warehouse. |
| FR009 | Capacity Monitoring | Display total, occupied and available capacity. |
| FR010 | Inventory Allocation | Reserve sufficient stock; reject insufficient stock. |
| FR011 | Stock Receiving | Increase inventory only when warehouse capacity is sufficient; log the transaction. |
| FR012 | Stock Dispatch | Decrease inventory only when stock is sufficient; log the dispatch. |
| FR013 | Stock Transfer | Update source and destination atomically after stock and capacity validation. |
| FR014 | Low-Stock Alerts | When quantity ≤ threshold, display the product in low-stock alerts. |
| FR015 | Inventory History | Show transaction type, quantity, product, warehouse, actor, reason and time. |
| FR016 | Order Creation | Valid order generates a unique ID and Created status. |
| FR017 | Order Approval | Authorized approval with sufficient stock sets Approved and allocates inventory. |
| FR018 | Order Tracking | Show current status and complete status history. |
| FR019 | Order Cancellation | Before shipment, set Cancelled and release reserved stock. |
| FR020 | Shipment Creation | Approved allocated order creates a unique shipment with Created status. |
| FR021 | Shipment Status | Allow valid transitions and reject invalid transitions. |
| FR022 | Shipment Tracking | Show current status and previous events for a valid reference. |
| FR023 | Dashboard | Role-appropriate KPIs load within five seconds. |
| FR024 | Inventory Report | Filters generate accurate warehouse-wise stock data. |
| FR025 | Order Report | Filters generate date, status and fulfilment views. |
| FR026 | Shipment Report | Displayed and exported data match and include shipment and delivery status. |
| FR027 | Exception Handling | Defined failures return user-safe messages, preserve data integrity and log diagnostics. |

> The source screenshots covered the catalogue through FR027 — if your doc 
> continues through FR034, add the remaining rows from the source.

---

## 10. Alternate Process Workflows

### 10.1 Insufficient Inventory
```
Order approval requested
   ↓
Inventory validation
   ↓
Insufficient inventory identified
   ↓
Order remains Pending / On Hold
   ↓
User notified
   ↓
Quantity modified, alternative warehouse selected or order cancelled
```

### 10.2 Order Rejection
```
Order submitted
   ↓
Approval review
   ↓
Order rejected
   ↓
Rejection reason recorded
   ↓
Reserved inventory released
   ↓
Sales Executive notified
```

### 10.3 Stock Transfer Failure
```
Transfer requested
   ↓
Stock and capacity validation
   ↓
Validation or transaction failure
   ↓
Entire transfer rolled back
   ↓
Existing balances retained
   ↓
Failure logged and user notified
```

### 10.4 Shipment Delivery Failure
```
Shipment In Transit
   ↓
Delivery attempt fails
   ↓
Failure reason recorded
   ↓
Shipment marked Failed / Returned
   ↓
Redispatch or return selected
   ↓
History updated
```

### 10.5 Expired Session
```
Protected request submitted
   ↓
JWT expiry detected
   ↓
Request rejected
   ↓
Session-expired message displayed
   ↓
User redirected to login
```

---

## 11. Exception Handling Matrix

| Scenario | Trigger | System Behaviour | User Message | Recovery | Acceptance |
|---|---|---|---|---|---|
| Invalid login | Incorrect credentials | Reject and log failed attempt | "Invalid username or password." | Retry or contact administrator | No token generated |
| Expired JWT | Token validity exceeded | Return unauthorized | "Your session has expired. Please log in again." | Redirect to login | Protected data inaccessible |
| Unauthorized action | Role lacks permission | Block and log | "You are not authorized to perform this action." | Request access if justified | No data modified |
| Duplicate user | Username/email exists | Reject | "Username or email already exists." | Enter unique details | Only one record exists |
| Product not found | Invalid/inactive ID | Reject operation | "The selected product is unavailable." | Refresh and select active product | No inventory transaction |
| Insufficient inventory | Quantity exceeds stock | Reject operation | "Insufficient inventory. Available: {quantity}" | Reduce quantity/change warehouse | Inventory never negative |
| Capacity exceeded | Incoming stock exceeds capacity | Reject receipt/transfer | "Warehouse capacity is insufficient." | Reduce quantity/change warehouse | Capacity not exceeded |
| Same transfer warehouse | Source equals destination | Reject transfer | "Source and destination must be different." | Choose another destination | No balances change |
| Transfer failure | Database/service error | Rollback all changes | "Transfer could not be completed." | Retry after restoration | No partial update |
| Duplicate order | Same request reference | Return existing/reject duplicate | "This order has already been submitted." | Open existing order | Only one order |
| Approval rejection | Manager/validation rejection | Set Rejected/Pending, keep reason | "Order was not approved: {reason}" | Modify and resubmit | Reason and actor recorded |
| Cancellation not allowed | Shipment started | Reject cancellation | "Order cannot be cancelled after shipment processing starts." | Use return workflow | Order/stock unchanged |
| Invalid order status | Illegal transition | Reject update | "Invalid order status transition." | Choose allowed transition | History consistent |
| Shipment creation failure | Not approved/allocated | Reject creation | "Shipment requires an approved, allocated order." | Complete approval/allocation | No shipment created |
| Invalid shipment status | Illegal transition | Reject update | "Invalid shipment status transition." | Choose allowed transition | History valid |
| Delivery failure | Customer/address/damage issue | Record reason and next status | "Delivery could not be completed." | Reschedule or return | Reason and next action stored |
| API timeout | Response time exceeded | Cancel safely; no blind retry | "Request timed out. Check status before retrying." | Verify and retry safely | No duplicate transaction |
| Database unavailable | PostgreSQL failure | Rollback and log incident | "Service is temporarily unavailable." | Restore and retry | No partial commit |
| Invalid report dates | Start after end | Reject report | "Start date must not be after end date." | Correct date range | Only valid report runs |
| Unexpected server error | Unhandled exception | Generic error; secure logging | "Unexpected error. Try again or contact administrator." | Review logs and resolve | No sensitive details exposed |

---

## 12. Non-Functional Requirements

| ID | Category | Requirement |
|---|---|---|
| NFR001 | Performance | Dashboard loads within five seconds. |
| NFR002 | Performance | API response below two seconds under normal conditions. |
| NFR003 | Security | JWT-based authentication protects user access. |
| NFR004 | Security | Passwords use secure one-way hashing before storage. |
| NFR005 | Security | RBAC restricts access by role. |
| NFR006 | Security | Sessions expire securely. |
| NFR007 | Availability | Target 99% availability during operational hours. |
| NFR008 | Scalability | Designed to support up to 500 concurrent users. |
| NFR009 | Reliability | Regular PostgreSQL backup and recovery support. |
| NFR010 | Reliability | Consistency across inventory, order and shipment transactions. |
| NFR011 | Maintainability | Modular architecture. |
| NFR012 | Maintainability | Standard coding and documentation practices. |
| NFR013 | Maintainability | Swagger/OpenAPI documentation. |
| NFR014 | Usability | Responsive, user-friendly interface. |
| NFR015 | Compatibility | Chrome, Edge and Firefox support. |
| NFR016 | Error Handling | Clear user messages without stack traces, SQL, tokens or sensitive details. |
| NFR017 | Transaction Management | Multi-step operations commit completely or roll back completely. |
| NFR018 | Auditability | Critical business and security actions create immutable audit records. |
| NFR019 | Recoverability | Database backup restoration and post-recovery validation. |
| NFR020 | Data Integrity | Constraints and validation prevent invalid, duplicate and inconsistent data. |
| NFR021 | Traceability | Requests and transactions have a reference/correlation identifier. |
| NFR022 | Testability | Critical requirements have positive, negative, authorization and recovery tests. |

---

## 13. Audit and Traceability Requirements
*(Content not fully captured in source screenshots. One visible fragment: "…values shall never be written to audit logs" — likely referring to passwords/tokens per BR020/15.2. Please refer to the original doc for the full section.)*

---

## 14. Reporting and KPI Requirements

| KPI | Definition / Formula | Expected View |
|---|---|---|
| Total Products | Count of active products | Overall count with category filter |
| Available Inventory | Sum of available quantity across active warehouses | Total and warehouse-wise |
| Low-Stock Products | Count where available quantity ≤ threshold | Product, warehouse and threshold |
| Out-of-Stock Products | Count where available quantity = 0 | Product and warehouse list |
| Inventory Accuracy | (Accurate verified records / records verified) × 100 | Percentage by warehouse/date |
| Inventory Turnover | Quantity issued / average inventory quantity | Trend by category/date |
| Fill Rate | (Quantity fulfilled / quantity requested) × 100 | Overall and product-wise |
| Order Fulfilment SLA | (Orders delivered within target / delivered orders) × 100 | Percentage, trend, overdue count |
| Pending Orders | Count in Created, Pending, Approved or Packed | Status count and ageing |
| Order Cancellation Rate | (Cancelled orders / total orders) × 100 | Percentage by reason/period |
| Warehouse Utilization | (Occupied capacity / total capacity) × 100 | Overall and warehouse-wise |
| Stock Transfer Success Rate | (Successful transfers / transfer requests) × 100 | Percentage and failures |
| In-Transit Shipments | Count currently In Transit | Shipment/order references |
| Shipment Success Rate | (Delivered shipments / dispatched shipments) × 100 | By period and warehouse |
| Shipment Return Rate | (Returned shipments / dispatched shipments) × 100 | Percentage and reasons |

---

## 15. Data Modelling and Governance

### 15.1 Core Entities
- Users and Roles
- Products
- Warehouses
- Inventory and Inventory Transactions
- Orders, Order Items and Order Approvals
- Shipments and Shipment Events
- Audit Logs

### 15.2 Governance Rules
- Product, warehouse, role and user records are controlled master data.
- Every master record has a unique identifier and active/inactive status.
- Referenced records use soft deletion or deactivation.
- A data dictionary defines mandatory fields, lengths, types and allowed values.
- PostgreSQL foreign keys enforce referential integrity.
- Inventory quantity changes require an inventory transaction.
- Common references reconcile orders, allocations and shipments.
- Key records store created and last-updated timestamps.
- Only authorized roles update master data.
- Passwords and tokens are excluded from audit logs.
- Passwords use secure one-way hashing.
- Retention periods are documented for audit and transaction records.

### 15.3 Transaction Reconciliation
- Stock received vs inventory increase
- Stock dispatched vs inventory decrease
- Source vs destination transfer quantities
*(This subsection was cut off in the source screenshot — there may be additional bullets in your original doc.)*
