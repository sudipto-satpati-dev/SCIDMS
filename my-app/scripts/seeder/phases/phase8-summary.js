/**
 * Phase 8: Data Seeding Audit & Summary Report
 */

const logger = require('../logger');
const SEED_STATE = require('../seed-state');

function phase8_SummaryReport(startTime) {
  const durationMs = Date.now() - startTime;
  const stats = SEED_STATE.stats;
  const COLORS = logger.COLORS;

  logger.banner('SCIDMS Data Seeder Execution Summary');

  console.log(`\n  ⏱  Total Execution Duration : ${COLORS.bright}${(durationMs / 1000).toFixed(2)}s${COLORS.reset}`);
  console.log(`  🎯 Total Operation Attempts  : ${COLORS.bright}${stats.totalAttempts}${COLORS.reset}`);
  console.log(`  ✔  Pre-Send Validations Pass : ${COLORS.green}${COLORS.bright}${stats.preValPasses}${COLORS.reset}`);
  console.log(`  ✖  Pre-Send Validations Fail : ${stats.preValFails > 0 ? COLORS.red : COLORS.dim}${stats.preValFails}${COLORS.reset}`);
  console.log(`  ✔  Post-Response Assert Pass : ${COLORS.green}${COLORS.bright}${stats.postAssertPasses}${COLORS.reset}`);
  console.log(`  ✖  Post-Response Assert Fail : ${stats.postAssertFails > 0 ? COLORS.red : COLORS.dim}${stats.postAssertFails}${COLORS.reset}`);

  console.log('\n' + COLORS.cyan + COLORS.bright + '📊 SEEDED DOMAIN ENTITY BREAKDOWN' + COLORS.reset);
  console.log(COLORS.dim + '─'.repeat(50) + COLORS.reset);
  console.table([
    { Domain: 'Users (RBAC)', SeededCount: SEED_STATE.users.length },
    { Domain: 'Product Categories', SeededCount: SEED_STATE.categories.length },
    { Domain: 'Product Catalog SKUs', SeededCount: SEED_STATE.products.length },
    { Domain: 'Warehouse Facilities', SeededCount: SEED_STATE.warehouses.length },
    { Domain: 'Inbound Stock Receipts', SeededCount: SEED_STATE.inventoryReceipts.length },
    { Domain: 'Customer Orders', SeededCount: SEED_STATE.orders.length },
    { Domain: 'Logistics Shipments', SeededCount: SEED_STATE.shipments.length }
  ]);

  if (stats.preValFails === 0 && stats.postAssertFails === 0) {
    console.log(`\n${COLORS.bgGreen}${COLORS.bright} SUCCESS ${COLORS.reset} ${COLORS.green}${COLORS.bright}All SCIDMS data seeding phases completed cleanly with 100% pre/post validation pass!${COLORS.reset}\n`);
  } else {
    console.log(`\n${COLORS.bgRed}${COLORS.bright} WARNING ${COLORS.reset} ${COLORS.yellow}Seeding completed with ${stats.preValFails} pre-validation errors and ${stats.postAssertFails} post-assertion errors.${COLORS.reset}\n`);
  }
}

module.exports = phase8_SummaryReport;
