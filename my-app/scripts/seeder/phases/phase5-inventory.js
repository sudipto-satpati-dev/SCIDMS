/**
 * Phase 5: Stock Inbound Receipt Seeding
 */

const logger = require('../logger');
const SEED_STATE = require('../seed-state');
const { httpRequest } = require('../http-client');
const { validatePreSend, assertPostResponse } = require('../validators');

async function phase5_Inventory() {
  logger.phase(5, 'Seeding Inbound Inventory Stock Receipts');

  for (let i = 0; i < SEED_STATE.products.length; i++) {
    const product = SEED_STATE.products[i];
    const warehouse = SEED_STATE.warehouses[i % SEED_STATE.warehouses.length] || { id: 1 };
    const receiveQty = (i + 1) * 150;

    SEED_STATE.stats.totalAttempts++;

    const payload = {
      productId: product.id,
      warehouseId: warehouse.id,
      quantity: receiveQty,
      referenceNumber: `REC-INB-${Date.now()}-${i + 1}`
    };

    const preVal = validatePreSend('INVENTORY_RECEIVE', payload);
    if (!preVal.valid) {
      SEED_STATE.stats.preValFails++;
      continue;
    }
    SEED_STATE.stats.preValPasses++;

    logger.info(`Receiving Stock: +${receiveQty} units of Product #${product.id} into Warehouse #${warehouse.id} (Ref: ${payload.referenceNumber})`);
    const res = await httpRequest('POST', '/api/inventory/receive', payload);

    const postAssert = assertPostResponse('INVENTORY_RECEIVE', res, { checkId: false });
    if (!postAssert.valid) {
      SEED_STATE.stats.postAssertFails++;
    } else {
      SEED_STATE.stats.postAssertPasses++;
      SEED_STATE.inventoryReceipts.push(res.data || payload);
      logger.success(`Stock Receipt Processed: +${receiveQty} units for Product #${product.id}`);
    }
  }
}

module.exports = phase5_Inventory;
