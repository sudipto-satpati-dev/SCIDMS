#!/usr/bin/env node
/**
 * SCIDMS — Smart Supply Chain Inventory & Distribution Management System
 * Comprehensive Modular Data Seeder Engine
 */

const CONFIG = require('./seeder/config');
const logger = require('./seeder/logger');
const {
  phase0_Auth,
  phase1_Users,
  phase2_Categories,
  phase3_Products,
  phase4_Warehouses,
  phase5_Inventory,
  phase6_Orders,
  phase7_ApprovalAndShipments,
  phase8_SummaryReport
} = require('./seeder/phases');

async function main() {
  const startTime = Date.now();
  logger.banner('SCIDMS Supply Chain Data Seeder Engine');
  
  if (CONFIG.dryRun) {
    logger.warn('Running in DRY-RUN mode. Pre-send validations will run, network mutations will be simulated.');
  }

  try {
    const authOk = await phase0_Auth();
    if (!authOk) {
      logger.error('Failed auth phase. Aborting seeder run.');
      process.exit(1);
    }

    await phase1_Users();
    await phase2_Categories();
    await phase3_Products();
    await phase4_Warehouses();
    await phase5_Inventory();
    await phase6_Orders();
    await phase7_ApprovalAndShipments();

    phase8_SummaryReport(startTime);
  } catch (err) {
    logger.error(`Fatal error in Data Seeder execution: ${err.message}`);
    console.error(err.stack);
    process.exit(1);
  }
}

main();
