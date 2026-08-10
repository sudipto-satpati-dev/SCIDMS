/**
 * SCIDMS Seeder — Master Datasets Definition
 */

const SEED_DATA = {
  users: [
    { username: 'wh_manager_1', email: 'wh.manager1@scidms.io', password: 'Password123!', role: 'WAREHOUSE MANAGER' },
    { username: 'sales_exec_1', email: 'sales.exec1@scidms.io', password: 'Password123!', role: 'SALES EXECUTIVE' },
    { username: 'dist_manager_1', email: 'dist.manager1@scidms.io', password: 'Password123!', role: 'DISTRIBUTION MANAGER' },
    { username: 'prod_manager_1', email: 'product.manager1@scidms.io', password: 'Password123!', role: 'PRODUCT MANAGER' },
    { username: 'ops_manager_1', email: 'ops.manager1@scidms.io', password: 'Password123!', role: 'MANAGER' }
  ],

  categories: [
    { name: 'Industrial Electronics', description: 'Microcontrollers, sensors, IoT gateways, and industrial power supplies.' },
    { name: 'Medical Equipment', description: 'Sterile diagnostics, patient monitoring systems, and cold-chain medical supplies.' },
    { name: 'Automotive Components', description: 'OEM replacement parts, brake sensors, electric vehicle batteries.' },
    { name: 'Consumer Packaging', description: 'Eco-friendly biodegradable containers, shipping cartons, and thermal insulation.' }
  ],

  products: [
    { name: 'SCIDMS IoT Sensor Hub V3', categoryIndex: 0, unitPrice: 249.99, lowStockThreshold: 15 },
    { name: 'Industrial Power Supply 500W', categoryIndex: 0, unitPrice: 129.50, lowStockThreshold: 10 },
    { name: 'Digital Pulse Oximeter Module', categoryIndex: 1, unitPrice: 89.00, lowStockThreshold: 25 },
    { name: 'Cryogenic Cold Transport Storage 50L', categoryIndex: 1, unitPrice: 1450.00, lowStockThreshold: 5 },
    { name: 'EV Lithium Battery Cell Pack 48V', categoryIndex: 2, unitPrice: 890.00, lowStockThreshold: 8 },
    { name: 'Brake Fluid Pressure Sensor', categoryIndex: 2, unitPrice: 45.75, lowStockThreshold: 30 },
    { name: 'Biodegradable Shipping Box Large', categoryIndex: 3, unitPrice: 4.50, lowStockThreshold: 100 }
  ],

  warehouses: [
    { name: 'Chicago Central Logistics Center', location: 'Chicago, IL, USA', totalCapacity: 50000, managerUserIndex: 0 },
    { name: 'Frankfurt European Distribution Facility', location: 'Frankfurt, Germany', totalCapacity: 75000, managerUserIndex: 0 },
    { name: 'Tokyo Port Automated Hub', location: 'Tokyo, Japan', totalCapacity: 60000, managerUserIndex: 4 }
  ],

  orders: [
    {
      customerName: 'Apex Health Systems',
      customerEmail: 'procurement@apexhealth.com',
      deliveryAddress: '100 Medical Center Way, Building B, Chicago, IL 60601',
      warehouseIndex: 0,
      itemRefs: [
        { productIndex: 2, quantity: 20 },
        { productIndex: 3, quantity: 2 }
      ]
    },
    {
      customerName: 'EuroTech Assembly Robotics GMBH',
      customerEmail: 'supply@eurotech-robotics.de',
      deliveryAddress: 'Industriestrasse 42, 60311 Frankfurt am Main, Germany',
      warehouseIndex: 1,
      itemRefs: [
        { productIndex: 0, quantity: 10 },
        { productIndex: 1, quantity: 15 }
      ]
    },
    {
      customerName: 'Nippon EV Mobility Solutions',
      customerEmail: 'orders@nipponev.jp',
      deliveryAddress: '3-1-1 Chiyoda-ku, Tokyo 100-0001, Japan',
      warehouseIndex: 2,
      itemRefs: [
        { productIndex: 4, quantity: 5 },
        { productIndex: 5, quantity: 40 }
      ]
    }
  ],

  shipments: [
    { orderIndex: 0, carrierName: 'FedEx Express Freight', trackingNumber: 'FDX-8890-4412-US' },
    { orderIndex: 1, carrierName: 'DHL Supply Chain Europe', trackingNumber: 'DHL-DE-99218-EXP' },
    { orderIndex: 2, carrierName: 'BlueDart Global Logistics', trackingNumber: 'BD-TK-3310-GLOBAL' }
  ]
};

module.exports = SEED_DATA;
