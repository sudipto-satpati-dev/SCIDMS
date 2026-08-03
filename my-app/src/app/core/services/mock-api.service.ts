/**
 * MockApiService
 *
 * Acts as a drop-in stand-in for Angular's HttpClient.
 * Every method returns an Observable (just like a real HTTP call would),
 * with a configurable simulated latency.
 *
 * MIGRATION GUIDE — when the Spring Boot backend is ready:
 *   1. Create a RealApiService that uses Angular's HttpClient.
 *   2. In each feature service, replace `MockApiService` with `RealApiService`.
 *   3. The component layer requires zero changes.
 *
 * All mutations operate on in-memory clones of the mock arrays so that
 * the original MOCK_* constants stay pristine across page refreshes
 * (within a single browser session the state is shared via the service singleton).
 */

import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';

import {
  MOCK_USERS, MOCK_PRODUCTS, MOCK_WAREHOUSES,
  MOCK_INVENTORY, MOCK_TRANSACTIONS,
  MOCK_ORDERS, MOCK_SHIPMENTS,
  MOCK_AUDIT_LOGS, MOCK_DASHBOARD,
} from '../mock/mock-data';

import {
  User, Product, Warehouse, InventoryRow, InventoryTransaction,
  Order, Shipment, AuditLog, DashboardStats,
  StockReceiveRequest, StockDispatchRequest, StockTransferRequest,
  CreateOrderRequest, OrderStatus, ApiInventoryItem, InventoryListParams, InventoryListResult,
  ApiReceiveStockRequest, ReceiveStockData
} from '../models/index';

/** Simulated network latency in ms */
const LATENCY = 400;

@Injectable({ providedIn: 'root' })
export class MockApiService {

  // ── In-memory state (deep-cloned on service instantiation) ──────────
  private users        = structuredClone(MOCK_USERS) as User[];
  private products     = structuredClone(MOCK_PRODUCTS) as Product[];
  private warehouses   = structuredClone(MOCK_WAREHOUSES) as Warehouse[];
  private inventory    = structuredClone(MOCK_INVENTORY) as InventoryRow[];
  private transactions = structuredClone(MOCK_TRANSACTIONS) as InventoryTransaction[];
  private orders       = structuredClone(MOCK_ORDERS) as Order[];
  private shipments    = structuredClone(MOCK_SHIPMENTS) as Shipment[];
  private auditLogs    = structuredClone(MOCK_AUDIT_LOGS) as AuditLog[];

  private respond<T>(data: T): Observable<T> {
    return of(structuredClone(data) as T).pipe(delay(LATENCY));
  }

  private fail(message: string): Observable<never> {
    return throwError(() => ({ message })).pipe(delay(LATENCY));
  }

  // ─────────────────────────────────────────────────────────────
  // Dashboard
  // ─────────────────────────────────────────────────────────────
  getDashboard(): Observable<DashboardStats> {
    return this.respond(MOCK_DASHBOARD);
  }

  // ─────────────────────────────────────────────────────────────
  // Auth (mock — token is a fixed stub)
  // ─────────────────────────────────────────────────────────────
  login(username: string, password: string): Observable<{ token: string; user: User }> {
    const user = this.users.find(
      u => u.username === username && u.status === 'Active'
    );
    if (!user || password.length < 4) {
      return this.fail('Invalid username or password.');
    }
    return this.respond({ token: 'mock-jwt-token-' + user.id, user });
  }

  // ─────────────────────────────────────────────────────────────
  // Users
  // ─────────────────────────────────────────────────────────────
  getUsers(): Observable<User[]> { return this.respond(this.users); }

  // createUser(data: Omit<User, 'id' | 'createdAt'>): Observable<User> {
  //   const duplicate = this.users.find(u => u.username === data.username || u.email === data.email);
  //   if (duplicate) return this.fail('Username or email already exists.');
  //   const newUser: User = {
  //     ...data,
  //     id: `USR-${1000 + this.users.length + 1}`,
  //     createdAt: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
  //   };
  //   this.users.push(newUser);
  //   this._addAudit('Created', 'USERS', newUser.id, 'NULL', `[${newUser.username}]`, 'User created', newUser.username);
  //   return this.respond(newUser);
  // }

  updateUser(id: number, data: Partial<User>): Observable<User> {
    const idx = this.users.findIndex(u => u.id === id);
    if (idx === -1) return this.fail('User not found.');
    const old = { ...this.users[idx] };
    this.users[idx] = { ...this.users[idx], ...data };
   // this._addAudit('Updated', 'USERS', id, `[${old.status}]`, `[${this.users[idx].status}]`, 'User updated', data.username || id);
    return this.respond(this.users[idx]);
  }

  toggleUserStatus(id: number): Observable<User> {
    const idx = this.users.findIndex(u => u.id === id);
    if (idx === -1) return this.fail('User not found.');
    const newStatus = this.users[idx].status === 'Active' ? 'Inactive' : 'Active';
    return this.updateUser(id, { status: newStatus });
  }

  // ─────────────────────────────────────────────────────────────
  // Products
  // ─────────────────────────────────────────────────────────────
  getProducts(): Observable<Product[]> { return this.respond(this.products); }

  createProduct(data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Observable<Product> {
    const newProduct: Product = {
      ...data,
      id: 1000 + this.products.length + 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.products.push(newProduct);
    this._addAudit('Created', 'PRODUCTS', String(newProduct.id), 'NULL', `[${newProduct.name}]`, 'Product added', 'admin');
    return this.respond(newProduct);
  }

  updateProduct(id: number, data: Partial<Product>): Observable<Product> {
    const idx = this.products.findIndex(p => p.id === id);
    if (idx === -1) return this.fail('Product not found.');
    const old = { ...this.products[idx] };
    this.products[idx] = { ...this.products[idx], ...data, updatedAt: new Date().toISOString() };
    this._addAudit('Updated', 'PRODUCTS', String(id), `[${old.status}]`, `[${this.products[idx].status}]`, 'Product updated', 'admin');
    return this.respond(this.products[idx]);
  }

  toggleProductStatus(id: number): Observable<Product> {
    const idx = this.products.findIndex(p => p.id === id);
    if (idx === -1) return this.fail('Product not found.');
    const newStatus = this.products[idx].status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    return this.updateProduct(id, { status: newStatus });
  }

  // ─────────────────────────────────────────────────────────────
  // Warehouses
  // ─────────────────────────────────────────────────────────────
  getWarehouses(): Observable<Warehouse[]> { return this.respond(this.warehouses); }

  getMyWarehouses(): Observable<Warehouse[]> {
    // For mock purposes, return assigned active warehouses (e.g., WH-001, WH-002)
    return this.respond(this.warehouses.filter(w => w.status === 'ACTIVE' || w.status === ('Active' as any)));
  }

  createWarehouse(data: Omit<Warehouse, 'id' | 'occupiedCapacity'>): Observable<Warehouse> {
    const newWh: Warehouse = {
      ...data,
      id: `WH-${String(this.warehouses.length + 1).padStart(3, '0')}`,
      occupiedCapacity: 0,
    };
    this.warehouses.push(newWh);
    this._addAudit('Created', 'WAREHOUSES', newWh.id, 'NULL', `[${newWh.name}]`, 'Warehouse created', 'admin');
    return this.respond(newWh);
  }

  updateWarehouse(id: string, data: Partial<Warehouse>): Observable<Warehouse> {
    const idx = this.warehouses.findIndex(w => w.id === id);
    if (idx === -1) return this.fail('Warehouse not found.');
    const old = { ...this.warehouses[idx] };
    this.warehouses[idx] = { ...this.warehouses[idx], ...data };
    this._addAudit('Updated', 'WAREHOUSES', id, `[${old.status}]`, `[${this.warehouses[idx].status}]`, 'Warehouse updated', 'admin');
    return this.respond(this.warehouses[idx]);
  }

  toggleWarehouseStatus(id: string): Observable<Warehouse> {
    const idx = this.warehouses.findIndex(w => w.id === id);
    if (idx === -1) return this.fail('Warehouse not found.');
    const newStatus = this.warehouses[idx].status === 'Active' ? 'Inactive' : 'Active';
    return this.updateWarehouse(id, { status: newStatus });
  }

  // ─────────────────────────────────────────────────────────────
  // Inventory
  // ─────────────────────────────────────────────────────────────
  getInventory(): Observable<InventoryRow[]> { return this.respond(this.inventory); }

  getInventoryApi(params: InventoryListParams = {}): Observable<InventoryListResult> {
    let filtered = [...this.inventory];

    if (params.search) {
      const q = params.search.toLowerCase();
      filtered = filtered.filter(r =>
        r.productName.toLowerCase().includes(q) ||
        r.warehouseName.toLowerCase().includes(q) ||
        r.productId.toLowerCase().includes(q) ||
        r.sku.toLowerCase().includes(q)
      );
    }

    if (params.productId != null && params.productId !== '') {
      const pid = String(params.productId);
      filtered = filtered.filter(r => r.productId === pid || r.productId.endsWith(pid));
    }

    if (params.warehouseId != null && params.warehouseId !== '') {
      const wid = String(params.warehouseId);
      const wids = wid.split(',').map(s => s.trim());
      filtered = filtered.filter(r =>
        wids.some(id => r.warehouseId === id || r.warehouseId.endsWith(id))
      );
    }

    const mapped: ApiInventoryItem[] = filtered.map((r, idx) => {
      const avail = r.availableQty;
      const alloc = r.allocatedQty;
      const onHand = avail + alloc;
      const low = avail > 0 && avail <= r.threshold;
      const out = avail === 0;
      const numProdId = parseInt(r.productId.replace(/\D/g, ''), 10) || (idx + 1);
      const numWhId = parseInt(r.warehouseId.replace(/\D/g, ''), 10) || (idx + 1);

      return {
        inventoryId: idx + 1,
        productId: numProdId,
        productName: r.productName,
        warehouseId: numWhId,
        warehouseName: r.warehouseName,
        onHandQuantity: onHand,
        allocatedQuantity: alloc,
        availableQuantity: avail,
        lowStockThreshold: r.threshold,
        lowStock: low,
        outOfStock: out,
        updatedAt: new Date().toISOString()
      };
    });

    const page = params.page ?? 0;
    const size = params.size ?? 10;
    const totalElements = mapped.length;
    const totalPages = Math.ceil(totalElements / size) || 1;

    const startIndex = page * size;
    const paginatedProducts = mapped.slice(startIndex, startIndex + size);

    return this.respond({
      products: paginatedProducts,
      page,
      size,
      totalElements,
      totalPages
    });
  }

  receiveStockApi(req: ApiReceiveStockRequest): Observable<ReceiveStockData> {
    const whId = String(req.warehouseId);
    const prodId = String(req.productId);

    const wh = this.warehouses.find(w => w.id === whId || w.id.endsWith(whId));
    if (!wh) return this.fail('Warehouse not found.');

    const product = this.products.find(p => String(p.id) === prodId || p.sku === prodId || String(p.id).endsWith(prodId));
    if (!product) return this.fail('Selected product not found.');

    let row = this.inventory.find(r => (r.warehouseId === wh.id || r.warehouseId === whId) && (r.productId === String(product.id) || r.productId === prodId));
    if (!row) {
      row = {
        productId: String(product.id),
        productName: product.name,
        sku: product.sku,
        warehouseId: wh.id,
        warehouseName: wh.name,
        availableQty: 0,
        allocatedQty: 0,
        threshold: 10
      };
      this.inventory.push(row);
    }

    row.availableQty += req.quantity;
    wh.occupiedCapacity = Math.min(wh.totalCapacity, wh.occupiedCapacity + req.quantity);

    const resData: ReceiveStockData = {
      referenceNumber: req.referenceNumber || `REF-${Math.floor(100000 + Math.random() * 900000)}`,
      transactionType: 'Received',
      productId: product.id,
      productName: product.name,
      destinationWarehouseId: wh.id,
      quantity: req.quantity,
      destinationAvailableQuantity: row.availableQty
    };

    return this.respond(resData);
  }

  dispatchStockApi(req: ApiDispatchStockRequest): Observable<DispatchStockData> {
    const whId = String(req.warehouseId);
    const prodId = String(req.productId);

    const wh = this.warehouses.find(w => w.id === whId || w.id.endsWith(whId));
    if (!wh) return this.fail('Warehouse not found.');

    const product = this.products.find(p => String(p.id) === prodId || p.sku === prodId || String(p.id).endsWith(prodId));
    if (!product) return this.fail('Selected product not found.');

    let row = this.inventory.find(r => (r.warehouseId === wh.id || r.warehouseId === whId) && (r.productId === String(product.id) || r.productId === prodId));
    if (!row || row.availableQty < req.quantity) {
      return this.fail(`Insufficient stock available (${row ? row.availableQty : 0} units).`);
    }

    row.availableQty -= req.quantity;
    wh.occupiedCapacity = Math.max(0, wh.occupiedCapacity - req.quantity);

    const resData: DispatchStockData = {
      referenceNumber: req.referenceNumber || `REF-${Math.floor(100000 + Math.random() * 900000)}`,
      transactionType: 'Dispatched',
      productId: product.id,
      productName: product.name,
      sourceWarehouseId: wh.id,
      quantity: req.quantity,
      sourceAvailableQuantity: row.availableQty
    };

    return this.respond(resData);
  }

  transferStockApi(req: ApiTransferStockRequest): Observable<TransferStockData> {
    const srcWhId = String(req.sourceWarehouseId);
    const dstWhId = String(req.destinationWarehouseId);
    const prodId = String(req.productId);

    const srcWh = this.warehouses.find(w => w.id === srcWhId || w.id.endsWith(srcWhId));
    if (!srcWh) return this.fail('Source warehouse not found.');

    const dstWh = this.warehouses.find(w => w.id === dstWhId || w.id.endsWith(dstWhId));
    if (!dstWh) return this.fail('Destination warehouse not found.');

    const product = this.products.find(p => String(p.id) === prodId || p.sku === prodId || String(p.id).endsWith(prodId));
    if (!product) return this.fail('Selected product not found.');

    let srcRow = this.inventory.find(r => (r.warehouseId === srcWh.id || r.warehouseId === srcWhId) && (r.productId === String(product.id) || r.productId === prodId));
    if (!srcRow || srcRow.availableQty < req.quantity) {
      return this.fail(`Insufficient stock in source warehouse (${srcRow ? srcRow.availableQty : 0} units).`);
    }

    const dstAvailCap = dstWh.totalCapacity - dstWh.occupiedCapacity;
    if (req.quantity > dstAvailCap) {
      return this.fail(`Exceeds destination warehouse capacity (${dstAvailCap} units free).`);
    }

    // Deduct from source
    srcRow.availableQty -= req.quantity;
    srcWh.occupiedCapacity = Math.max(0, srcWh.occupiedCapacity - req.quantity);

    // Add to destination
    let dstRow = this.inventory.find(r => (r.warehouseId === dstWh.id || r.warehouseId === dstWhId) && (r.productId === String(product.id) || r.productId === prodId));
    if (!dstRow) {
      dstRow = {
        productId: String(product.id),
        productName: product.name,
        sku: product.sku,
        warehouseId: dstWh.id,
        warehouseName: dstWh.name,
        availableQty: 0,
        allocatedQty: 0,
        threshold: 10
      };
      this.inventory.push(dstRow);
    }
    dstRow.availableQty += req.quantity;
    dstWh.occupiedCapacity = Math.min(dstWh.totalCapacity, dstWh.occupiedCapacity + req.quantity);

    const resData: TransferStockData = {
      referenceNumber: req.referenceNumber || `REF-${Math.floor(100000 + Math.random() * 900000)}`,
      transactionType: 'Transferred',
      productId: product.id,
      productName: product.name,
      sourceWarehouseId: srcWh.id,
      destinationWarehouseId: dstWh.id,
      quantity: req.quantity,
      sourceAvailableQuantity: srcRow.availableQty,
      destinationAvailableQuantity: dstRow.availableQty
    };

    return this.respond(resData);
  }

  getTransactionHistoryApi(params: TransactionHistoryParams): Observable<TransactionHistoryResult> {
    const mockTxList: ApiInventoryTransaction[] = this.transactions.map((tx, idx) => {
      let typeStr = tx.type.toUpperCase();
      if (typeStr === 'RECEIVED') typeStr = 'RECEIVE';
      if (typeStr === 'DISPATCHED') typeStr = 'DISPATCH';
      if (typeStr === 'TRANSFERRED') typeStr = 'TRANSFER_OUT';

      return {
        transactionId: idx + 101,
        referenceNumber: `REF-${1000 + idx}`,
        transactionType: typeStr,
        productId: parseInt(tx.productId.replace(/\D/g, ''), 10) || (idx + 1),
        productName: tx.productName,
        sourceWarehouseId: parseInt(tx.warehouseId.replace(/\D/g, ''), 10) || 1,
        sourceWarehouseName: tx.warehouseName,
        destinationWarehouseId: typeStr.includes('TRANSFER') ? 2 : undefined,
        destinationWarehouseName: typeStr.includes('TRANSFER') ? 'Regional WH-002' : undefined,
        quantity: tx.quantity,
        performedBy: tx.actor || 'System Admin',
        description: tx.reason,
        transactionDate: tx.timestamp || new Date().toISOString()
      };
    });

    let filtered = mockTxList;
    if (params.transactionType) {
      filtered = filtered.filter(t => t.transactionType.toUpperCase() === params.transactionType!.toUpperCase());
    }
    if (params.warehouseId) {
      const wStr = String(params.warehouseId);
      filtered = filtered.filter(t => String(t.sourceWarehouseId) === wStr || String(t.destinationWarehouseId) === wStr);
    }
    if (params.productId) {
      const pStr = String(params.productId).toLowerCase();
      filtered = filtered.filter(t => String(t.productId) === pStr || t.productName.toLowerCase().includes(pStr));
    }

    const page = params.page ?? 0;
    const size = params.size ?? 10;
    const totalElements = filtered.length;
    const totalPages = Math.ceil(totalElements / size) || 1;
    const startIndex = page * size;
    const paginated = filtered.slice(startIndex, startIndex + size);

    return this.respond({
      transactions: paginated,
      page,
      size,
      totalElements,
      totalPages
    });
  }

  getInventoryByWarehouse(warehouseId: string): Observable<InventoryRow[]> {
    return this.respond(this.inventory.filter(r => r.warehouseId === warehouseId));
  }

  receiveStock(req: StockReceiveRequest): Observable<InventoryTransaction> {
    // Validate warehouse capacity (BR008)
    const wh = this.warehouses.find(w => w.id === req.warehouseId);
    if (!wh) return this.fail('Warehouse not found.');
    const available = wh.totalCapacity - wh.occupiedCapacity;
    if (req.quantity > available) {
      return this.fail(`Warehouse capacity is insufficient. Available: ${available} units.`);
    }
    // Validate product (BR005)
    const product = this.products.find(p => String(p.id) === req.productId || p.sku === req.productId);
    if (!product) return this.fail('The selected product is unavailable.');

    // Update inventory row (create if absent)
    let row = this.inventory.find(r => r.warehouseId === req.warehouseId && r.productId === req.productId);
    if (!row) {
      row = {
        productId: String(product.id), productName: product.name, sku: product.sku,
        warehouseId: wh.id, warehouseName: wh.name,
        availableQty: 0, allocatedQty: 0, threshold: 10,
      };
      this.inventory.push(row);
    }
    row.availableQty += req.quantity;

    // Update warehouse occupied capacity
    wh.occupiedCapacity += req.quantity;

    // Log transaction
    const txn: InventoryTransaction = {
      id: `TXN-${3000 + this.transactions.length + 1}`,
      type: 'Received',
      productId: String(product.id), productName: product.name,
      warehouseId: wh.id, warehouseName: wh.name,
      quantity: req.quantity, actor: 'current.user',
      reason: req.reason,
      timestamp: new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
    };
    this.transactions.unshift(txn);
    this._addAudit('Updated', 'INVENTORY', `${product.id} / ${wh.id}`,
      `[Stock: ${row.availableQty - req.quantity}]`, `[Stock: ${row.availableQty}]`, req.reason, 'current.user');
    return this.respond(txn);
  }

  dispatchStock(req: StockDispatchRequest): Observable<InventoryTransaction> {
    const wh = this.warehouses.find(w => w.id === req.warehouseId);
    if (!wh) return this.fail('Warehouse not found.');
    const product = this.products.find(p => String(p.id) === req.productId || p.sku === req.productId);
    if (!product) return this.fail('The selected product is unavailable.');
    const row = this.inventory.find(r => r.warehouseId === req.warehouseId && r.productId === req.productId);
    if (!row || row.availableQty < req.quantity) {
      return this.fail(`Insufficient inventory. Available: ${row?.availableQty ?? 0} units.`);
    }

    row.availableQty    -= req.quantity;
    wh.occupiedCapacity -= req.quantity;

    const txn: InventoryTransaction = {
      id: `TXN-${3000 + this.transactions.length + 1}`,
      type: 'Dispatched',
      productId: String(product.id), productName: product.name,
      warehouseId: wh.id, warehouseName: wh.name,
      quantity: req.quantity, actor: 'current.user',
      reason: req.reason,
      timestamp: new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
    };
    this.transactions.unshift(txn);
    this._addAudit('Updated', 'INVENTORY', `${product.id} / ${wh.id}`,
      `[Stock: ${row.availableQty + req.quantity}]`, `[Stock: ${row.availableQty}]`, req.reason, 'current.user');
    return this.respond(txn);
  }

  transferStock(req: StockTransferRequest): Observable<InventoryTransaction> {
    if (req.sourceWarehouseId === req.destinationWarehouseId) {
      return this.fail('Source and destination must be different.');
    }
    const src  = this.warehouses.find(w => w.id === req.sourceWarehouseId);
    const dest = this.warehouses.find(w => w.id === req.destinationWarehouseId);
    if (!src || !dest) return this.fail('Warehouse not found.');
    const product = this.products.find(p => String(p.id) === req.productId || p.sku === req.productId);
    if (!product) return this.fail('The selected product is unavailable.');

    const srcRow = this.inventory.find(r => r.warehouseId === req.sourceWarehouseId && r.productId === req.productId);
    if (!srcRow || srcRow.availableQty < req.quantity) {
      return this.fail(`Insufficient inventory. Available: ${srcRow?.availableQty ?? 0} units.`);
    }
    const destCapacity = dest.totalCapacity - dest.occupiedCapacity;
    if (req.quantity > destCapacity) {
      return this.fail(`Destination warehouse capacity is insufficient. Available: ${destCapacity} units.`);
    }

    // Update source
    srcRow.availableQty -= req.quantity;
    src.occupiedCapacity -= req.quantity;

    // Update destination (create row if absent)
    let destRow = this.inventory.find(r => r.warehouseId === req.destinationWarehouseId && r.productId === req.productId);
    if (!destRow) {
      destRow = {
        productId: String(product.id), productName: product.name, sku: product.sku,
        warehouseId: dest.id, warehouseName: dest.name,
        availableQty: 0, allocatedQty: 0, threshold: 10,
      };
      this.inventory.push(destRow);
    }
    destRow.availableQty   += req.quantity;
    dest.occupiedCapacity  += req.quantity;

    const txn: InventoryTransaction = {
      id: `TXN-${3000 + this.transactions.length + 1}`,
      type: 'Transferred',
      productId: String(product.id), productName: product.name,
      warehouseId: src.id, warehouseName: `${src.name} → ${dest.name}`,
      quantity: req.quantity, actor: 'current.user',
      reason: req.reason,
      timestamp: new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
    };
    this.transactions.unshift(txn);
    this._addAudit('Updated', 'INVENTORY', `${product.id}`,
      `[${src.name}: ${srcRow.availableQty + req.quantity}]`,
      `[${src.name}: ${srcRow.availableQty} | ${dest.name}: ${destRow.availableQty}]`,
      req.reason, 'current.user');
    return this.respond(txn);
  }

  getTransactions(): Observable<InventoryTransaction[]> { return this.respond(this.transactions); }

  getLowStockItems(): Observable<InventoryRow[]> {
    return this.respond(this.inventory.filter(r => r.availableQty <= r.threshold));
  }

  // ─────────────────────────────────────────────────────────────
  // Orders
  // ─────────────────────────────────────────────────────────────
  getOrdersApi(params: OrderListParams): Observable<OrderListResult> {
    const list: Order[] = this.orders.map((o, idx) => {
      const numId = typeof o.id === 'number' ? o.id : parseInt(String(o.id).replace(/\D/g, ''), 10) || (idx + 1);
      const wh = this.warehouses[idx % this.warehouses.length] || { id: 'WH-001', name: 'Central Warehouse' };

      const items: OrderItem[] = (o.items || []).map((it, itemIdx) => {
        const p = this.products.find(prod => String(prod.id) === String(it.productId) || prod.name === it.productName);
        const price = it.unitPrice || p?.unitPrice || 100;
        const qty = it.quantity || 1;
        return {
          itemId: itemIdx + 1,
          productId: p ? p.id : it.productId,
          productName: p ? p.name : it.productName || 'Product Item',
          quantity: qty,
          unitPrice: price,
          lineTotal: price * qty
        };
      });

      const totalAmt = items.reduce((sum, item) => sum + item.lineTotal, 0);

      return {
        id: numId,
        orderNumber: o.orderNumber || (typeof o.id === 'string' && o.id.startsWith('ORD-') ? o.id : `ORD-${10000 + numId}`),
        customerName: o.customerName || 'Customer',
        customerEmail: o.customerEmail || `${o.customerName.toLowerCase().replace(/\s+/g, '.')}@example.com`,
        deliveryAddress: o.deliveryAddress || o.address || 'Standard Delivery Address',
        warehouseId: o.warehouseId || wh.id,
        warehouseName: o.warehouseName || wh.name,
        status: (o.status || 'CREATED').toUpperCase(),
        totalAmount: totalAmt || 500,
        createdBy: o.submittedBy || 'System User',
        approvedBy: o.approvedBy || undefined,
        items,
        createdAt: o.createdAt || new Date().toISOString(),
        updatedAt: o.updatedAt || new Date().toISOString()
      };
    });

    let filtered = list;
    if (params.search) {
      const s = params.search.toLowerCase();
      filtered = filtered.filter(o =>
        o.orderNumber.toLowerCase().includes(s) ||
        o.customerName.toLowerCase().includes(s) ||
        o.customerEmail.toLowerCase().includes(s)
      );
    }
    if (params.status) {
      filtered = filtered.filter(o => String(o.status).toUpperCase() === params.status!.toUpperCase());
    }
    if (params.warehouseId != null && params.warehouseId !== '') {
      const wStr = String(params.warehouseId);
      filtered = filtered.filter(o => String(o.warehouseId) === wStr);
    }

    const page = params.page ?? 0;
    const size = params.size ?? 10;
    const totalElements = filtered.length;
    const totalPages = Math.ceil(totalElements / size) || 1;
    const startIndex = page * size;
    const paginated = filtered.slice(startIndex, startIndex + size);

    return this.respond({
      orders: paginated,
      page,
      size,
      totalElements,
      totalPages
    });
  }

  createOrderApi(req: CreateOrderRequest): Observable<Order> {
    if (!req.customerName || !req.items || !req.items.length) {
      return this.fail('Customer name and at least one item are required.');
    }

    const wh = this.warehouses.find(w => String(w.id) === String(req.warehouseId)) || this.warehouses[0];
    const newId = this.orders.length + 101;
    const orderNum = `ORD-${Math.floor(10000 + Math.random() * 90000)}`;

    const items: OrderItem[] = req.items.map((it, idx) => {
      const p = this.products.find(prod => String(prod.id) === String(it.productId) || prod.sku === String(it.productId));
      const price = p?.unitPrice || 150;
      const qty = it.quantity || 1;
      return {
        itemId: idx + 1,
        productId: p ? p.id : it.productId,
        productName: p ? p.name : `Product #${it.productId}`,
        quantity: qty,
        unitPrice: price,
        lineTotal: price * qty
      };
    });

    const totalAmt = items.reduce((sum, i) => sum + i.lineTotal, 0);

    const newOrder: Order = {
      id: newId,
      orderNumber: orderNum,
      customerName: req.customerName,
      customerEmail: req.customerEmail || `${req.customerName.toLowerCase().replace(/\s+/g, '.')}@example.com`,
      deliveryAddress: req.deliveryAddress,
      warehouseId: wh ? wh.id : 1,
      warehouseName: wh ? wh.name : 'Primary Warehouse',
      status: 'CREATED',
      totalAmount: totalAmt,
      createdBy: 'Warehouse Manager',
      items,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.orders.unshift(newOrder as any);
    return this.respond(newOrder);
  }

  getOrders(): Observable<Order[]> { return this.respond(this.orders); }

  getOrderById(id: string): Observable<Order> {
    const order = this.orders.find(o => o.id === id);
    return order ? this.respond(order) : this.fail('Order not found.');
  }

  createOrder(req: CreateOrderRequest): Observable<Order> {
    if (!req.customerName || !req.items.length) {
      return this.fail('Valid customer data and at least one item are required.');
    }
    const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const newId = `ORD-${1024 + this.orders.length + 1}`;
    const items = req.items.map(i => {
      const p = this.products.find(pr => String(pr.id) === String(i.productId));
      return { productId: String(p?.id ?? i.productId), productName: p?.name ?? 'Product', unitPrice: p?.unitPrice ?? 0, quantity: i.quantity };
    });
    const order: Order = {
      id: newId, customerName: req.customerName,
      contactNumber: req.contactNumber, address: req.address,
      orderDate: today, status: 'Created',
      priority: 'Medium', approvedBy: '—', approvedDate: '—',
      submittedBy: 'current.user', items,
      history: [{ status: 'Created', changedBy: 'current.user', timestamp: today, notes: 'Order created' }],
    };
    this.orders.unshift(order);
    this._addAudit('Created', 'ORDERS', newId, 'NULL', '[Created]', 'New order', 'current.user');
    return this.respond(order);
  }

  approveOrder(id: string): Observable<Order> {
    const idx = this.orders.findIndex(o => o.id === id);
    if (idx === -1) return this.fail('Order not found.');
    if (this.orders[idx].status !== 'Created') return this.fail('Only Created orders can be approved.');
    const now = new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    this.orders[idx].status = 'Approved';
    this.orders[idx].approvedBy = 'current.user';
    this.orders[idx].approvedDate = now;
    this.orders[idx].history.unshift({ status: 'Approved', changedBy: 'current.user', timestamp: now, notes: 'Order approved' });
    this._addAudit('Updated', 'ORDERS', id, '[Created]', '[Approved]', 'Order approved', 'current.user');
    return this.respond(this.orders[idx]);
  }

  rejectOrder(id: string, reason: string): Observable<Order> {
    if (!reason.trim()) return this.fail('Rejection reason is mandatory.');
    const idx = this.orders.findIndex(o => o.id === id);
    if (idx === -1) return this.fail('Order not found.');
    const now = new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    this.orders[idx].status = 'Rejected';
    this.orders[idx].rejectionReason = reason;
    this.orders[idx].history.unshift({ status: 'Rejected', changedBy: 'current.user', timestamp: now, notes: reason });
    this._addAudit('Updated', 'ORDERS', id, '[Created]', '[Rejected]', reason, 'current.user');
    return this.respond(this.orders[idx]);
  }

  cancelOrder(id: string): Observable<Order> {
    const idx = this.orders.findIndex(o => o.id === id);
    if (idx === -1) return this.fail('Order not found.');
    const allowed: OrderStatus[] = ['Created', 'Approved'];
    if (!allowed.includes(this.orders[idx].status)) {
      return this.fail('Order cannot be cancelled after shipment processing starts.');
    }
    const now = new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    this.orders[idx].status = 'Cancelled';
    this.orders[idx].history.unshift({ status: 'Cancelled', changedBy: 'current.user', timestamp: now, notes: 'Cancelled by user' });
    this._addAudit('Updated', 'ORDERS', id, '[Active]', '[Cancelled]', 'Order cancelled', 'current.user');
    return this.respond(this.orders[idx]);
  }

  // ─────────────────────────────────────────────────────────────
  // Shipments
  // ─────────────────────────────────────────────────────────────
  getShipments(): Observable<Shipment[]> { return this.respond(this.shipments); }

  getShipmentById(id: string): Observable<Shipment> {
    const s = this.shipments.find(sh => sh.id === id);
    return s ? this.respond(s) : this.fail('Shipment not found.');
  }

  createShipment(orderId: string): Observable<Shipment> {
    const order = this.orders.find(o => o.id === orderId);
    if (!order) return this.fail('Order not found.');
    if (order.status !== 'Approved') {
      return this.fail('Shipment requires an approved, allocated order.');
    }
    const existing = this.shipments.find(s => s.orderId === orderId);
    if (existing) return this.fail('A shipment already exists for this order.');
    const now = new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    const newShipment: Shipment = {
      id: `SHP-${Math.floor(1000000 + Math.random() * 9000000)}-N`,
      orderId, customerName: order.customerName,
      customerAddress: order.address,
      status: 'Created', dispatchDate: 'Pending', lastUpdated: now,
      carrierName: 'Pending Assignment', carrierTracking: 'N/A',
      serviceLevel: 'Standard', vehicleId: 'Unassigned',
      originHub: 'Central Dispatch Hub', originAddress: 'Dhaka, BD',
      estimatedArrival: 'TBD',
      history: [{ status: 'Created', changedBy: 'current.user', timestamp: now, notes: 'Shipment created from approved order' }],
    };
    this.shipments.unshift(newShipment);
    // Mark order as Dispatched
    order.status = 'Dispatched';
    order.history.unshift({ status: 'Dispatched', changedBy: 'System', timestamp: now, notes: `Shipment ${newShipment.id} created` });
    this._addAudit('Created', 'SHIPMENTS', newShipment.id, 'NULL', '[Created]', 'Shipment created', 'current.user');
    return this.respond(newShipment);
  }

  updateShipmentStatus(id: string, status: Shipment['status'], notes: string = ''): Observable<Shipment> {
    const idx = this.shipments.findIndex(s => s.id === id);
    if (idx === -1) return this.fail('Shipment not found.');
    const now = new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    const old = this.shipments[idx].status;
    this.shipments[idx].status = status;
    this.shipments[idx].lastUpdated = now;
    this.shipments[idx].history.unshift({ status, changedBy: 'current.user', timestamp: now, notes });
    this._addAudit('Updated', 'SHIPMENTS', id, `[${old}]`, `[${status}]`, notes || 'Status updated', 'current.user');
    return this.respond(this.shipments[idx]);
  }

  reportDeliveryFailure(id: string, reason: string, nextAction: string): Observable<Shipment> {
    if (!reason.trim()) return this.fail('Failure reason and next recovery status are mandatory.');
    const newStatus: Shipment['status'] = nextAction === 'Return' ? 'Returned' : 'In Transit';
    return this.updateShipmentStatus(id, newStatus, `Failure: ${reason}. Action: ${nextAction}`);
  }

  // ─────────────────────────────────────────────────────────────
  // Audit Logs
  // ─────────────────────────────────────────────────────────────
  getAuditLogs(): Observable<AuditLog[]> { return this.respond(this.auditLogs); }

  // ─────────────────────────────────────────────────────────────
  // Internal helpers
  // ─────────────────────────────────────────────────────────────
  private _addAudit(
    action: AuditLog['action'],
    module: AuditLog['module'],
    ref: string,
    oldVal: string,
    newVal: string,
    reason: string,
    actor: string,
  ): void {
    const now = new Date().toLocaleString('en-US', { month: 'short', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const initials = actor.split(/[._]/).map(s => s[0]?.toUpperCase() || '').join('').slice(0, 3);
    this.auditLogs.unshift({
      id: `AUD-${99200 + this.auditLogs.length}`,
      timestamp: now, actorName: actor, actorRole: 'SYSTEM',
      actorInitials: initials || 'SYS', action, module,
      recordRef: ref, oldValue: oldVal, newValue: newVal, reason,
    });
  }
}
