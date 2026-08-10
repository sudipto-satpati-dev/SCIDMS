/**
 * SCIDMS Seeder — Phases Pipeline Orchestrator Barrel Export
 */

const phase0_Auth = require('./phase0-auth');
const phase1_Users = require('./phase1-users');
const phase2_Categories = require('./phase2-categories');
const phase3_Products = require('./phase3-products');
const phase4_Warehouses = require('./phase4-warehouses');
const phase5_Inventory = require('./phase5-inventory');
const phase6_Orders = require('./phase6-orders');
const phase7_ApprovalAndShipments = require('./phase7-shipments');
const phase8_SummaryReport = require('./phase8-summary');

module.exports = {
  phase0_Auth,
  phase1_Users,
  phase2_Categories,
  phase3_Products,
  phase4_Warehouses,
  phase5_Inventory,
  phase6_Orders,
  phase7_ApprovalAndShipments,
  phase8_SummaryReport
};
