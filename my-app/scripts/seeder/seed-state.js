/**
 * SCIDMS Seeder — Shared Execution State & Relational ID Store
 */

const SEED_STATE = {
  users: [],
  categories: [],
  products: [],
  warehouses: [],
  inventoryReceipts: [],
  orders: [],
  shipments: [],
  stats: {
    totalAttempts: 0,
    preValPasses: 0,
    preValFails: 0,
    postAssertPasses: 0,
    postAssertFails: 0,
    skipped: 0
  }
};

module.exports = SEED_STATE;
