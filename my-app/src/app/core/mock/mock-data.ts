/**
 * SCIDMS — Centralised Mock Data Store
 *
 * All services read/mutate these arrays through the MockApiService.
 * Swap MockApiService for a real HttpClient-based ApiService when the
 * Spring Boot backend is ready — component code stays untouched.
 */

import {
  User, Product, Warehouse, InventoryRow, InventoryTransaction,
  Order, Shipment, AuditLog, DashboardStats
} from '../models/index';

// ─────────────────────────────────────────────────────────────
// USERS
// ─────────────────────────────────────────────────────────────
export const MOCK_USERS: User[] = [
  { id: 'USR-1001', username: 'alex.rivera',   email: 'a.rivera@scidms-logistics.com', role: 'ADMIN',        status: 'Active',   createdAt: 'Oct 12, 2023' },
  { id: 'USR-1002', username: 'sarah.j_mgmt',  email: 's.jordan@scidms.io',            role: 'Warehouse Manager',    status: 'Active',   createdAt: 'Oct 15, 2023' },
  { id: 'USR-1003', username: 'mark.h_sales',  email: 'm.hendricks@scidms.io',         role: 'Sales Executive',      status: 'Inactive', createdAt: 'Nov 02, 2023' },
  { id: 'USR-1004', username: 'lindsey.wu',     email: 'l.wu@scidms.io',               role: 'ADMIN',        status: 'Active',   createdAt: 'Nov 10, 2023' },
  { id: 'USR-1005', username: 'ben.kline',      email: 'b.kline@scidms.io',            role: 'Sales Executive',      status: 'Active',   createdAt: 'Dec 01, 2023' },
  { id: 'USR-1006', username: 'priya.sharma',   email: 'p.sharma@scidms.io',           role: 'Distribution Manager', status: 'Active',   createdAt: 'Dec 14, 2023' },
  { id: 'USR-1007', username: 'james.wright',   email: 'j.wright@scidms.io',           role: 'Management',           status: 'Active',   createdAt: 'Jan 03, 2024' },
  { id: 'USR-1008', username: 'nina.patel',     email: 'n.patel@scidms.io',            role: 'Warehouse Manager',    status: 'Inactive', createdAt: 'Jan 20, 2024' },
];

// ─────────────────────────────────────────────────────────────
// PRODUCTS
// ─────────────────────────────────────────────────────────────
export const MOCK_PRODUCTS: Product[] = [
  { id: 'PRD-1001', name: 'Industrial Pump Filter',  sku: 'IPF-001', category: 'Industrial',    unitPrice: 4500,  availableQty: 3,   threshold: 10,  status: 'Active'   },
  { id: 'PRD-1002', name: 'Conveyor Belt Type-B',    sku: 'CBT-002', category: 'Industrial',    unitPrice: 28000, availableQty: 0,   threshold: 5,   status: 'Active'   },
  { id: 'PRD-1003', name: 'Safety Helmet Pro',       sku: 'SHP-003', category: 'Safety',        unitPrice: 850,   availableQty: 142, threshold: 20,  status: 'Active'   },
  { id: 'PRD-1004', name: 'Hydraulic Seal Kit',      sku: 'HSK-004', category: 'Industrial',    unitPrice: 3200,  availableQty: 2,   threshold: 8,   status: 'Active'   },
  { id: 'PRD-1005', name: 'Packing Foam Roll',       sku: 'PFR-005', category: 'Packaging',     unitPrice: 1200,  availableQty: 0,   threshold: 20,  status: 'Active'   },
  { id: 'PRD-1006', name: 'Safety Gloves (L)',       sku: 'SGL-006', category: 'Safety',        unitPrice: 320,   availableQty: 7,   threshold: 15,  status: 'Active'   },
  { id: 'PRD-1007', name: 'Electric Drill 18V',      sku: 'ED1-007', category: 'Tools',         unitPrice: 9500,  availableQty: 54,  threshold: 10,  status: 'Active'   },
  { id: 'PRD-1008', name: 'Steel Pipe 2 inch',       sku: 'SP2-008', category: 'Raw Materials', unitPrice: 650,   availableQty: 320, threshold: 50,  status: 'Active'   },
  { id: 'PRD-1009', name: 'Circuit Breaker 20A',     sku: 'CB2-009', category: 'Electronics',   unitPrice: 2200,  availableQty: 88,  threshold: 15,  status: 'Active'   },
  { id: 'PRD-1010', name: 'Thermal Label Roll',      sku: 'TLR-010', category: 'Packaging',     unitPrice: 480,   availableQty: 215, threshold: 30,  status: 'Inactive' },
  { id: 'PRD-1011', name: 'Air Compressor 50L',      sku: 'AC5-011', category: 'Tools',         unitPrice: 35000, availableQty: 12,  threshold: 5,   status: 'Active'   },
  { id: 'PRD-1012', name: 'Copper Wire 1.5mm',       sku: 'CW1-012', category: 'Raw Materials', unitPrice: 980,   availableQty: 6,   threshold: 20,  status: 'Active'   },
];

// ─────────────────────────────────────────────────────────────
// WAREHOUSES
// ─────────────────────────────────────────────────────────────
const PHOTO = [
  'linear-gradient(135deg, #1e3a5f 0%, #2d6a9f 100%)',
  'linear-gradient(135deg, #134e4a 0%, #0f766e 100%)',
  'linear-gradient(135deg, #7c2d12 0%, #c2410c 100%)',
  'linear-gradient(135deg, #1e1b4b 0%, #4338ca 100%)',
  'linear-gradient(135deg, #064e3b 0%, #059669 100%)',
];

export const MOCK_WAREHOUSES: Warehouse[] = [
  { id: 'WH-001', name: 'Central WH-A',      location: 'Dhaka, BD',      region: 'Dhaka',       totalCapacity: 10000, occupiedCapacity: 8800, status: 'Active',   photo: PHOTO[0] },
  { id: 'WH-002', name: 'North Logistics-B', location: 'Chittagong, BD', region: 'Chittagong',  totalCapacity: 10000, occupiedCapacity: 6200, status: 'Active',   photo: PHOTO[1] },
  { id: 'WH-003', name: 'South Hub-D',       location: 'Sylhet, BD',     region: 'Sylhet',      totalCapacity: 5000,  occupiedCapacity: 4750, status: 'Active',   photo: PHOTO[2] },
  { id: 'WH-004', name: 'West Transit-C',    location: 'Rajshahi, BD',   region: 'Rajshahi',    totalCapacity: 5000,  occupiedCapacity: 750,  status: 'Inactive', photo: PHOTO[3] },
  { id: 'WH-005', name: 'East Port-E',       location: 'Khulna, BD',     region: 'Khulna',      totalCapacity: 8000,  occupiedCapacity: 5760, status: 'Active',   photo: PHOTO[4] },
];

// ─────────────────────────────────────────────────────────────
// INVENTORY ROWS (warehouse-scoped stock levels)
// ─────────────────────────────────────────────────────────────
export const MOCK_INVENTORY: InventoryRow[] = [
  { productId: 'PRD-1001', productName: 'Industrial Pump Filter',  sku: 'IPF-001', warehouseId: 'WH-001', warehouseName: 'Warehouse A — Dhaka',       availableQty: 3,   allocatedQty: 2,  threshold: 10 },
  { productId: 'PRD-1001', productName: 'Industrial Pump Filter',  sku: 'IPF-001', warehouseId: 'WH-002', warehouseName: 'Warehouse B — Chittagong',   availableQty: 0,   allocatedQty: 0,  threshold: 10 },
  { productId: 'PRD-1002', productName: 'Conveyor Belt Type-B',    sku: 'CBT-002', warehouseId: 'WH-001', warehouseName: 'Warehouse A — Dhaka',       availableQty: 0,   allocatedQty: 1,  threshold: 5  },
  { productId: 'PRD-1003', productName: 'Safety Helmet Pro',       sku: 'SHP-003', warehouseId: 'WH-001', warehouseName: 'Warehouse A — Dhaka',       availableQty: 2800,allocatedQty: 200,threshold: 20 },
  { productId: 'PRD-1003', productName: 'Safety Helmet Pro',       sku: 'SHP-003', warehouseId: 'WH-003', warehouseName: 'Warehouse C — Sylhet',      availableQty: 2200,allocatedQty: 100,threshold: 20 },
  { productId: 'PRD-1003', productName: 'Safety Helmet Pro',       sku: 'SHP-003', warehouseId: 'WH-005', warehouseName: 'Warehouse E — Khulna',      availableQty: 1800,allocatedQty: 80, threshold: 20 },
  { productId: 'PRD-1004', productName: 'Hydraulic Seal Kit',      sku: 'HSK-004', warehouseId: 'WH-002', warehouseName: 'Warehouse B — Chittagong',  availableQty: 2,   allocatedQty: 0,  threshold: 8  },
  { productId: 'PRD-1005', productName: 'Packing Foam Roll',       sku: 'PFR-005', warehouseId: 'WH-001', warehouseName: 'Warehouse A — Dhaka',       availableQty: 0,   allocatedQty: 5,  threshold: 20 },
  { productId: 'PRD-1005', productName: 'Packing Foam Roll',       sku: 'PFR-005', warehouseId: 'WH-002', warehouseName: 'Warehouse B — Chittagong',  availableQty: 500, allocatedQty: 0,  threshold: 20 },
  { productId: 'PRD-1006', productName: 'Safety Gloves (L)',       sku: 'SGL-006', warehouseId: 'WH-001', warehouseName: 'Warehouse A — Dhaka',       availableQty: 7,   allocatedQty: 3,  threshold: 15 },
  { productId: 'PRD-1006', productName: 'Safety Gloves (L)',       sku: 'SGL-006', warehouseId: 'WH-005', warehouseName: 'Warehouse E — Khulna',      availableQty: 600, allocatedQty: 20, threshold: 15 },
  { productId: 'PRD-1007', productName: 'Electric Drill 18V',      sku: 'ED1-007', warehouseId: 'WH-003', warehouseName: 'Warehouse C — Sylhet',      availableQty: 54,  allocatedQty: 0,  threshold: 10 },
  { productId: 'PRD-1008', productName: 'Steel Pipe 2 inch',       sku: 'SP2-008', warehouseId: 'WH-001', warehouseName: 'Warehouse A — Dhaka',       availableQty: 2100,allocatedQty: 400,threshold: 50 },
  { productId: 'PRD-1008', productName: 'Steel Pipe 2 inch',       sku: 'SP2-008', warehouseId: 'WH-002', warehouseName: 'Warehouse B — Chittagong',  availableQty: 3200,allocatedQty: 40, threshold: 50 },
  { productId: 'PRD-1008', productName: 'Steel Pipe 2 inch',       sku: 'SP2-008', warehouseId: 'WH-005', warehouseName: 'Warehouse E — Khulna',      availableQty: 2400,allocatedQty: 200,threshold: 50 },
  { productId: 'PRD-1009', productName: 'Circuit Breaker 20A',     sku: 'CB2-009', warehouseId: 'WH-004', warehouseName: 'Warehouse D — Rajshahi',    availableQty: 750, allocatedQty: 12, threshold: 15 },
  { productId: 'PRD-1009', productName: 'Circuit Breaker 20A',     sku: 'CB2-009', warehouseId: 'WH-005', warehouseName: 'Warehouse E — Khulna',      availableQty: 960, allocatedQty: 0,  threshold: 15 },
  { productId: 'PRD-1010', productName: 'Thermal Label Roll',      sku: 'TLR-010', warehouseId: 'WH-001', warehouseName: 'Warehouse A — Dhaka',       availableQty: 1850,allocatedQty: 0,  threshold: 30 },
  { productId: 'PRD-1011', productName: 'Air Compressor 50L',      sku: 'AC5-011', warehouseId: 'WH-003', warehouseName: 'Warehouse C — Sylhet',      availableQty: 12,  allocatedQty: 2,  threshold: 5  },
  { productId: 'PRD-1012', productName: 'Copper Wire 1.5mm',       sku: 'CW1-012', warehouseId: 'WH-002', warehouseName: 'Warehouse B — Chittagong',  availableQty: 6,   allocatedQty: 0,  threshold: 20 },
];

// ─────────────────────────────────────────────────────────────
// INVENTORY TRANSACTIONS
// ─────────────────────────────────────────────────────────────
export const MOCK_TRANSACTIONS: InventoryTransaction[] = [
  { id: 'TXN-3001', type: 'Received',    productId: 'PRD-1003', productName: 'Safety Helmet Pro',      warehouseId: 'WH-001', warehouseName: 'Warehouse A — Dhaka',       quantity: 100, actor: 'karim.wm',     reason: 'Monthly restock',            timestamp: '26 Jul 2026, 09:14 AM' },
  { id: 'TXN-3002', type: 'Dispatched',  productId: 'PRD-1001', productName: 'Industrial Pump Filter', warehouseId: 'WH-001', warehouseName: 'Warehouse A — Dhaka',       quantity: 5,   actor: 'sadia.wm',     reason: 'Order ORD-1022 fulfilment',  timestamp: '26 Jul 2026, 10:02 AM' },
  { id: 'TXN-3003', type: 'Transferred', productId: 'PRD-1005', productName: 'Packing Foam Roll',      warehouseId: 'WH-002', warehouseName: 'Warehouse B — Chittagong',  quantity: 50,  actor: 'karim.wm',     reason: 'Rebalance stock levels',     timestamp: '25 Jul 2026, 03:45 PM' },
  { id: 'TXN-3004', type: 'Received',    productId: 'PRD-1012', productName: 'Copper Wire 1.5mm',      warehouseId: 'WH-002', warehouseName: 'Warehouse B — Chittagong',  quantity: 200, actor: 'admin_sadi',   reason: 'Supplier delivery #INV-881', timestamp: '25 Jul 2026, 11:30 AM' },
  { id: 'TXN-3005', type: 'Dispatched',  productId: 'PRD-1006', productName: 'Safety Gloves (L)',      warehouseId: 'WH-001', warehouseName: 'Warehouse A — Dhaka',       quantity: 8,   actor: 'tanvir.sales', reason: 'Order ORD-1023 fulfilment',  timestamp: '24 Jul 2026, 02:18 PM' },
  { id: 'TXN-3006', type: 'Transferred', productId: 'PRD-1008', productName: 'Steel Pipe 2 inch',      warehouseId: 'WH-003', warehouseName: 'Warehouse C — Sylhet',      quantity: 80,  actor: 'karim.wm',     reason: 'Demand surge in Sylhet',     timestamp: '24 Jul 2026, 09:55 AM' },
  { id: 'TXN-3007', type: 'Received',    productId: 'PRD-1007', productName: 'Electric Drill 18V',     warehouseId: 'WH-003', warehouseName: 'Warehouse C — Sylhet',      quantity: 20,  actor: 'admin_sadi',   reason: 'New purchase order',         timestamp: '23 Jul 2026, 04:00 PM' },
  { id: 'TXN-3008', type: 'Dispatched',  productId: 'PRD-1002', productName: 'Conveyor Belt Type-B',   warehouseId: 'WH-001', warehouseName: 'Warehouse A — Dhaka',       quantity: 2,   actor: 'sadia.wm',     reason: 'Order ORD-1020 fulfilment',  timestamp: '23 Jul 2026, 01:10 PM' },
  { id: 'TXN-3009', type: 'Received',    productId: 'PRD-1004', productName: 'Hydraulic Seal Kit',     warehouseId: 'WH-002', warehouseName: 'Warehouse B — Chittagong',  quantity: 15,  actor: 'karim.wm',     reason: 'Emergency restock',          timestamp: '22 Jul 2026, 10:40 AM' },
  { id: 'TXN-3010', type: 'Transferred', productId: 'PRD-1009', productName: 'Circuit Breaker 20A',    warehouseId: 'WH-004', warehouseName: 'Warehouse D — Rajshahi',    quantity: 30,  actor: 'admin_sadi',   reason: 'Warehouse consolidation',    timestamp: '22 Jul 2026, 08:25 AM' },
  { id: 'TXN-3011', type: 'Dispatched',  productId: 'PRD-1010', productName: 'Thermal Label Roll',     warehouseId: 'WH-001', warehouseName: 'Warehouse A — Dhaka',       quantity: 40,  actor: 'tanvir.sales', reason: 'Order ORD-1019 fulfilment',  timestamp: '21 Jul 2026, 03:30 PM' },
  { id: 'TXN-3012', type: 'Received',    productId: 'PRD-1011', productName: 'Air Compressor 50L',     warehouseId: 'WH-003', warehouseName: 'Warehouse C — Sylhet',      quantity: 5,   actor: 'karim.wm',     reason: 'Quarterly procurement',      timestamp: '21 Jul 2026, 11:00 AM' },
];

// ─────────────────────────────────────────────────────────────
// ORDERS
// ─────────────────────────────────────────────────────────────
export const MOCK_ORDERS: Order[] = [
  {
    id: 'ORD-1024', customerName: 'Ahmed Trading Co.',   contactNumber: '+880-1711-111111',
    address: '12 Mirpur Rd, Dhaka',   orderDate: '26 Jul 2026', status: 'Created',
    priority: 'High',   approvedBy: '—', approvedDate: '—', submittedBy: 'sales_nabil',
    items: [
      { productId: 'PRD-1003', productName: 'Safety Helmet Pro',      unitPrice: 850,  quantity: 20 },
      { productId: 'PRD-1006', productName: 'Safety Gloves (L)',      unitPrice: 320,  quantity: 50 },
    ],
    history: [{ status: 'Created', changedBy: 'sales_nabil', timestamp: '26 Jul 2026 – 08:00 AM', notes: 'Order placed' }]
  },
  {
    id: 'ORD-1023', customerName: 'Rahim Enterprises',   contactNumber: '+880-1811-222222',
    address: '45 CDA Ave, Chittagong', orderDate: '25 Jul 2026', status: 'Approved',
    priority: 'Medium', approvedBy: 'farhan.mgmt', approvedDate: '25 Jul 2026, 10:00', submittedBy: 'sales_tanvir',
    items: [{ productId: 'PRD-1008', productName: 'Steel Pipe 2 inch', unitPrice: 650, quantity: 100 }],
    history: [
      { status: 'Approved', changedBy: 'farhan.mgmt',  timestamp: '25 Jul 2026 – 10:00 AM', notes: 'Stock verified'   },
      { status: 'Created',  changedBy: 'sales_tanvir', timestamp: '25 Jul 2026 – 08:30 AM', notes: 'Customer request' }
    ]
  },
  {
    id: 'ORD-1022', customerName: 'Karim Brothers Ltd.', contactNumber: '+880-1911-333333',
    address: '7 Zindabazar, Sylhet',  orderDate: '24 Jul 2026', status: 'Dispatched',
    priority: 'High',   approvedBy: 'farhan.mgmt', approvedDate: '24 Jul 2026, 14:30', submittedBy: 'sales_nabil',
    items: [
      { productId: 'PRD-1007', productName: 'Electric Drill 18V',  unitPrice: 9500, quantity: 5  },
      { productId: 'PRD-1009', productName: 'Circuit Breaker 20A', unitPrice: 2200, quantity: 10 },
    ],
    history: [
      { status: 'Dispatched', changedBy: 'System (Automated)', timestamp: '26 Jul 2026 – 11:00 AM', notes: 'Carrier: DHL #88221'  },
      { status: 'Packed',     changedBy: 'Warehouse Ops',       timestamp: '25 Jul 2026 – 08:15 AM', notes: 'Verified weight: 14kg'},
      { status: 'Approved',   changedBy: 'farhan.mgmt',          timestamp: '24 Jul 2026 – 14:30 PM', notes: 'Credit check passed' },
      { status: 'Created',    changedBy: 'Sales Portal',          timestamp: '24 Jul 2026 – 09:00 AM', notes: 'Inbound API'         }
    ]
  },
  {
    id: 'ORD-1021', customerName: 'Nabil Distributors',  contactNumber: '+880-1611-444444',
    address: '23 New Market, Dhaka',  orderDate: '23 Jul 2026', status: 'Delivered',
    priority: 'Low',    approvedBy: 'farhan.mgmt', approvedDate: '22 Jul 2026, 11:00', submittedBy: 'sales_nabil',
    items: [{ productId: 'PRD-1004', productName: 'Hydraulic Seal Kit', unitPrice: 3200, quantity: 8 }],
    history: [
      { status: 'Delivered',  changedBy: 'System (Automated)', timestamp: '23 Jul 2026 – 03:00 PM', notes: 'Signed by recipient' },
      { status: 'Dispatched', changedBy: 'dist_rahim',          timestamp: '22 Jul 2026 – 04:00 PM', notes: 'Left warehouse'      },
      { status: 'Packed',     changedBy: 'Warehouse Ops',        timestamp: '22 Jul 2026 – 01:00 PM', notes: 'Packed & sealed'     },
      { status: 'Approved',   changedBy: 'farhan.mgmt',          timestamp: '22 Jul 2026 – 11:00 AM', notes: 'Approved'            },
      { status: 'Created',    changedBy: 'sales_nabil',           timestamp: '21 Jul 2026 – 09:00 AM', notes: 'Order placed'        }
    ]
  },
  {
    id: 'ORD-1020', customerName: 'Sadia Retail Group',  contactNumber: '+880-1511-555555',
    address: '88 Agrabad, Chittagong', orderDate: '22 Jul 2026', status: 'Cancelled',
    priority: 'Low',    approvedBy: '—', approvedDate: '—', submittedBy: 'sales_tanvir',
    items: [{ productId: 'PRD-1010', productName: 'Thermal Label Roll', unitPrice: 480, quantity: 30 }],
    history: [
      { status: 'Cancelled', changedBy: 'sales_tanvir', timestamp: '22 Jul 2026 – 10:00 AM', notes: 'Customer request' },
      { status: 'Created',   changedBy: 'sales_tanvir', timestamp: '22 Jul 2026 – 08:00 AM', notes: 'Order placed'     }
    ]
  },
  {
    id: 'ORD-1019', customerName: 'Metro Supplies BD',   contactNumber: '+880-1411-666666',
    address: '5 Sadar Rd, Rajshahi',  orderDate: '21 Jul 2026', status: 'Rejected',
    priority: 'Medium', approvedBy: 'farhan.mgmt', approvedDate: '21 Jul 2026, 14:00', submittedBy: 'sales_nabil',
    rejectionReason: 'Insufficient stock for Copper Wire 1.5mm',
    items: [{ productId: 'PRD-1012', productName: 'Copper Wire 1.5mm', unitPrice: 980, quantity: 200 }],
    history: [
      { status: 'Rejected', changedBy: 'farhan.mgmt', timestamp: '21 Jul 2026 – 14:00 PM', notes: 'Insufficient stock' },
      { status: 'Created',  changedBy: 'sales_nabil',  timestamp: '21 Jul 2026 – 09:00 AM', notes: 'Order placed'      }
    ]
  },
  {
    id: 'ORD-1018', customerName: 'Global Trade BD',     contactNumber: '+880-1311-777777',
    address: '14 Shaheb Bazar, Rajshahi', orderDate: '20 Jul 2026', status: 'Approved',
    priority: 'High',   approvedBy: 'farhan.mgmt', approvedDate: '20 Jul 2026, 15:00', submittedBy: 'sales_tanvir',
    items: [{ productId: 'PRD-1011', productName: 'Air Compressor 50L', unitPrice: 35000, quantity: 2 }],
    history: [
      { status: 'Approved', changedBy: 'farhan.mgmt',  timestamp: '20 Jul 2026 – 15:00 PM', notes: 'Approved for dispatch' },
      { status: 'Created',  changedBy: 'sales_tanvir', timestamp: '20 Jul 2026 – 09:00 AM', notes: 'Order placed'          }
    ]
  },
];

// ─────────────────────────────────────────────────────────────
// SHIPMENTS
// ─────────────────────────────────────────────────────────────
export const MOCK_SHIPMENTS: Shipment[] = [
  {
    id: 'SHP-4829102-X', orderId: 'ORD-1022',
    customerName: 'Karim Brothers Ltd.', customerAddress: '7 Zindabazar, Sylhet',
    status: 'In Transit', dispatchDate: 'Oct 21, 2026', lastUpdated: 'Oct 23, 2026 08:42 AM',
    carrierName: 'SwiftTrans Logistics', carrierTracking: 'SW-0092-FF1', serviceLevel: 'Priority Freight',
    vehicleId: 'TRK-2940-X', originHub: 'North Distribution Hub', originAddress: '42 Industrial Pkwy, Chicago, IL 60601',
    estimatedArrival: 'Oct 24, 14:00',
    history: [
      { status: 'In Transit',       changedBy: 'System Auto-Scan',  timestamp: 'Oct 23, 2026 • 08:42 AM', notes: 'Departed Facility - Chicago Transit Hub' },
      { status: 'Arrived at Terminal', changedBy: 'Michael Zhang',  timestamp: 'Oct 22, 2026 • 11:15 PM', notes: 'Shipment consolidated for long-haul'     },
      { status: 'Ready for Dispatch', changedBy: 'Sarah Connor',    timestamp: 'Oct 21, 2026 • 02:30 PM', notes: 'Manifest verified and loaded'             },
      { status: 'Created',           changedBy: 'Inventory Manager', timestamp: 'Oct 20, 2026 • 09:15 AM', notes: 'Initial shipment record created'         },
    ]
  },
  {
    id: 'SHP-1092834-A', orderId: 'ORD-1023',
    customerName: 'Rahim Enterprises', customerAddress: '45 CDA Ave, Chittagong',
    status: 'Ready for Dispatch', dispatchDate: 'Oct 26, 2026', lastUpdated: 'Oct 26, 2026 10:15 AM',
    carrierName: 'FedEx Express', carrierTracking: 'FX-8821-992', serviceLevel: 'Standard Express',
    vehicleId: 'TRK-1102-A', originHub: 'Central Dispatch Hub', originAddress: '88 Supply Chain Way, St. Louis, MO 63101',
    estimatedArrival: 'Oct 28, 16:30',
    history: [
      { status: 'Ready for Dispatch', changedBy: 'David Miller',    timestamp: 'Oct 26, 2026 • 10:15 AM', notes: 'Assigned to FedEx Express vehicle TRK-1102-A'     },
      { status: 'Created',            changedBy: 'Distribution Admin', timestamp: 'Oct 25, 2026 • 04:20 PM', notes: 'Shipment record created from approved order' },
    ]
  },
  {
    id: 'SHP-9920182-C', orderId: 'ORD-1021',
    customerName: 'Nabil Distributors', customerAddress: '23 New Market, Dhaka',
    status: 'Delivered', dispatchDate: 'Oct 18, 2026', lastUpdated: 'Oct 20, 2026 04:30 PM',
    carrierName: 'DHL Global Logistics', carrierTracking: 'DHL-3391-771', serviceLevel: 'Overnight Air',
    vehicleId: 'TRK-4009-C', originHub: 'East Coast Transit Hub', originAddress: '15 Gateway Ave, Boston, MA 02108',
    estimatedArrival: 'Delivered Oct 20, 16:30',
    history: [
      { status: 'Delivered',          changedBy: 'Driver Signature Scan', timestamp: 'Oct 20, 2026 • 04:30 PM', notes: 'Signed by J. Vance at Loading Bay 3' },
      { status: 'In Transit',         changedBy: 'DHL Dispatch',          timestamp: 'Oct 19, 2026 • 08:00 AM', notes: 'Out for delivery'                    },
      { status: 'Ready for Dispatch', changedBy: 'Sarah Connor',          timestamp: 'Oct 18, 2026 • 02:00 PM', notes: 'Cleared for regional transport'       },
      { status: 'Created',            changedBy: 'Inventory Manager',     timestamp: 'Oct 17, 2026 • 11:30 AM', notes: 'Initial record created'              },
    ]
  },
  {
    id: 'SHP-3391024-F', orderId: 'ORD-1019',
    customerName: 'Metro Supplies BD', customerAddress: '5 Sadar Road, Rajshahi',
    status: 'Returned', dispatchDate: 'Oct 15, 2026', lastUpdated: 'Oct 17, 2026 11:00 AM',
    carrierName: 'SwiftTrans Logistics', carrierTracking: 'SW-9912-BB3', serviceLevel: 'Ground Freight',
    vehicleId: 'TRK-1092-F', originHub: 'Northwest Hub', originAddress: '100 Terminal Way, Seattle, WA 98134',
    estimatedArrival: 'Returned to Warehouse',
    failureReason: 'Customer Unavailable / Premises Closed', nextAction: 'Return to Warehouse',
    history: [
      { status: 'Returned',           changedBy: 'Distribution Manager', timestamp: 'Oct 17, 2026 • 11:00 AM', notes: 'Delivery failed: Premises closed. Stock returned to hub.' },
      { status: 'In Transit',         changedBy: 'System Auto-Scan',     timestamp: 'Oct 16, 2026 • 09:00 AM', notes: 'Delivery attempt failed'                               },
      { status: 'Ready for Dispatch', changedBy: 'David Miller',         timestamp: 'Oct 15, 2026 • 01:15 PM', notes: 'Dispatched to route 4'                                  },
      { status: 'Created',            changedBy: 'Inventory Manager',    timestamp: 'Oct 14, 2026 • 03:00 PM', notes: 'Initial order shipment creation'                        },
    ]
  },
  {
    id: 'SHP-5521093-B', orderId: 'ORD-1018',
    customerName: 'Global Trade BD', customerAddress: '14 Shaheb Bazar, Rajshahi',
    status: 'Created', dispatchDate: 'Pending', lastUpdated: 'Oct 26, 2026 09:00 AM',
    carrierName: 'Pending Carrier Assignment', carrierTracking: 'N/A', serviceLevel: 'Standard',
    vehicleId: 'Unassigned', originHub: 'South Central Hub', originAddress: '50 Industrial Blvd, Rajshahi',
    estimatedArrival: 'TBD',
    history: [
      { status: 'Created', changedBy: 'Distribution Manager', timestamp: 'Oct 26, 2026 • 09:00 AM', notes: 'Shipment created and queued for allocation' }
    ]
  },
];

// ─────────────────────────────────────────────────────────────
// AUDIT LOGS
// ─────────────────────────────────────────────────────────────
export const MOCK_AUDIT_LOGS: AuditLog[] = [
  { id: 'AUD-99101', timestamp: 'Jul 26, 2026, 14:30:12', actorName: 'karim.wm',     actorRole: 'WAREHOUSE MANAGER', actorInitials: 'KW', action: 'Updated', module: 'INVENTORY',   recordRef: 'PRD-1003 / WH-001', oldValue: '[Stock: 2700]', newValue: '[Stock: 2800]',       reason: 'Monthly restock receipt',           ipAddress: '192.168.1.10'  },
  { id: 'AUD-99102', timestamp: 'Jul 26, 2026, 10:15:00', actorName: 'farhan.mgmt',  actorRole: 'MANAGEMENT',        actorInitials: 'FM', action: 'Updated', module: 'ORDERS',      recordRef: 'ORD-1023',          oldValue: '[Created]',    newValue: '[Approved]',          reason: 'Stock verified, approved',          ipAddress: '10.0.1.5'      },
  { id: 'AUD-99103', timestamp: 'Jul 25, 2026, 11:30:00', actorName: 'admin_sadi',   actorRole: 'ADMIN',             actorInitials: 'AS', action: 'Updated', module: 'INVENTORY',   recordRef: 'PRD-1012 / WH-002', oldValue: '[Stock: 0]',   newValue: '[Stock: 200]',        reason: 'Supplier delivery #INV-881',        ipAddress: '10.0.4.12'     },
  { id: 'AUD-99104', timestamp: 'Jul 24, 2026, 14:30:00', actorName: 'farhan.mgmt',  actorRole: 'MANAGEMENT',        actorInitials: 'FM', action: 'Updated', module: 'ORDERS',      recordRef: 'ORD-1022',          oldValue: '[Created]',    newValue: '[Approved]',          reason: 'Credit check passed',               ipAddress: '10.0.1.5'      },
  { id: 'AUD-99105', timestamp: 'Jul 24, 2026, 09:55:00', actorName: 'karim.wm',     actorRole: 'WAREHOUSE MANAGER', actorInitials: 'KW', action: 'Updated', module: 'INVENTORY',   recordRef: 'PRD-1008 / WH-003', oldValue: '[Stock: 2120]', newValue: '[Stock: 2200]',       reason: 'Transfer from WH-002',              ipAddress: '192.168.1.10'  },
  { id: 'AUD-99106', timestamp: 'Jul 23, 2026, 16:00:00', actorName: 'admin_sadi',   actorRole: 'ADMIN',             actorInitials: 'AS', action: 'Created', module: 'PRODUCTS',    recordRef: 'PRD-1011',          oldValue: 'NULL',         newValue: '[Air Compressor 50L]',reason: 'New product added to catalogue',    ipAddress: '10.0.4.12'     },
  { id: 'AUD-99107', timestamp: 'Jul 22, 2026, 11:00:00', actorName: 'alex.rivera',  actorRole: 'ADMIN',     actorInitials: 'AR', action: 'Updated', module: 'USERS',       recordRef: 'USR-1003',          oldValue: '[Active]',     newValue: '[Inactive]',          reason: 'Account suspended per HR request',  ipAddress: '10.0.0.1'      },
  { id: 'AUD-99108', timestamp: 'Jul 22, 2026, 08:25:00', actorName: 'admin_sadi',   actorRole: 'ADMIN',             actorInitials: 'AS', action: 'Updated', module: 'INVENTORY',   recordRef: 'PRD-1009 / WH-004', oldValue: '[Stock: 720]', newValue: '[Stock: 750]',        reason: 'Warehouse consolidation transfer',  ipAddress: '10.0.4.12'     },
  { id: 'AUD-99109', timestamp: 'Jul 21, 2026, 14:00:00', actorName: 'farhan.mgmt',  actorRole: 'MANAGEMENT',        actorInitials: 'FM', action: 'Updated', module: 'ORDERS',      recordRef: 'ORD-1019',          oldValue: '[Created]',    newValue: '[Rejected]',          reason: 'Insufficient stock for Copper Wire',ipAddress: '10.0.1.5'      },
  { id: 'AUD-99110', timestamp: 'Jul 20, 2026, 15:00:00', actorName: 'alex.rivera',  actorRole: 'ADMIN',     actorInitials: 'AR', action: 'Updated', module: 'WAREHOUSES',  recordRef: 'WH-004',            oldValue: '[Active]',     newValue: '[Inactive]',          reason: 'Facility under maintenance',        ipAddress: '10.0.0.1'      },
  { id: 'AUD-99111', timestamp: 'Jul 20, 2026, 09:00:00', actorName: 'sales_tanvir', actorRole: 'SALES EXECUTIVE',   actorInitials: 'ST', action: 'Created', module: 'ORDERS',      recordRef: 'ORD-1018',          oldValue: 'NULL',         newValue: '[Created]',           reason: 'New customer order',                ipAddress: '192.168.2.44'  },
  { id: 'AUD-99112', timestamp: 'Jul 19, 2026, 10:00:00', actorName: 'dist_rahim',   actorRole: 'DISTRIBUTION MGR',  actorInitials: 'DR', action: 'Created', module: 'SHIPMENTS',   recordRef: 'SHP-5521093-B',     oldValue: 'NULL',         newValue: '[Created]',           reason: 'Shipment queued for allocation',    ipAddress: '192.168.3.22'  },
];

// ─────────────────────────────────────────────────────────────
// DASHBOARD STATS
// ─────────────────────────────────────────────────────────────
export const MOCK_DASHBOARD: DashboardStats = {
  orderStatusData: [
    { label: 'Delivered',  count: 148, pct: 74, color: 'bar-green'  },
    { label: 'Approved',   count: 34,  pct: 17, color: 'bar-blue'   },
    { label: 'Pending',    count: 12,  pct: 6,  color: 'bar-orange' },
    { label: 'Cancelled',  count: 6,   pct: 3,  color: 'bar-red'    },
  ],
  shipmentPerfData: [
    { label: 'Success Rate', pct: 92, color: 'circle-green'  },
    { label: 'On-Time SLA',  pct: 87, color: 'circle-blue'   },
    { label: 'Return Rate',  pct: 4,  color: 'circle-orange' },
  ],
  warehouseData: [
    { name: 'Warehouse A — Dhaka',      used: 88, occupied: 8800, total: 10000 },
    { name: 'Warehouse B — Chittagong', used: 65, occupied: 6500, total: 10000 },
    { name: 'Warehouse C — Sylhet',     used: 42, occupied: 2100, total: 5000  },
    { name: 'Warehouse D — Rajshahi',   used: 71, occupied: 3550, total: 5000  },
  ],
  recentOrders: [
    { id: 'ORD-1024', customer: 'Ahmed Trading Co.',   items: 2, total: '৳ 33,000', status: 'Created',   statusClass: 'badge-blue',   date: '26 Jul 2026' },
    { id: 'ORD-1023', customer: 'Rahim Enterprises',   items: 1, total: '৳ 65,000', status: 'Approved',  statusClass: 'badge-green',  date: '25 Jul 2026' },
    { id: 'ORD-1022', customer: 'Karim Brothers Ltd.',  items: 2, total: '৳ 69,500', status: 'Dispatched',statusClass: 'badge-blue',   date: '24 Jul 2026' },
    { id: 'ORD-1021', customer: 'Nabil Distributors',   items: 1, total: '৳ 25,600', status: 'Delivered', statusClass: 'badge-green',  date: '23 Jul 2026' },
    { id: 'ORD-1020', customer: 'Sadia Retail Group',   items: 1, total: '৳ 14,400', status: 'Cancelled', statusClass: 'badge-red',    date: '22 Jul 2026' },
  ],
  lowStockItems: [
    { product: 'Industrial Pump Filter',  warehouse: 'Warehouse A — Dhaka',      qty: 3,  threshold: 10 },
    { product: 'Conveyor Belt Type-B',    warehouse: 'Warehouse A — Dhaka',      qty: 0,  threshold: 5  },
    { product: 'Hydraulic Seal Kit',      warehouse: 'Warehouse B — Chittagong', qty: 2,  threshold: 8  },
    { product: 'Packing Foam Roll',       warehouse: 'Warehouse A — Dhaka',      qty: 0,  threshold: 20 },
    { product: 'Safety Gloves (L)',       warehouse: 'Warehouse A — Dhaka',      qty: 7,  threshold: 15 },
    { product: 'Copper Wire 1.5mm',       warehouse: 'Warehouse B — Chittagong', qty: 6,  threshold: 20 },
  ],
};
