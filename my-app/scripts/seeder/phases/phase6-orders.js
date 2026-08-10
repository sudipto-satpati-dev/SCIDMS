/**
 * Phase 6: Customer Order Seeding
 */

const logger = require('../logger');
const SEED_DATA = require('../seed-data');
const SEED_STATE = require('../seed-state');
const { httpRequest } = require('../http-client');
const { validatePreSend, assertPostResponse } = require('../validators');

async function phase6_Orders() {
  logger.phase(6, 'Seeding Customer Orders');

  for (let i = 0; i < SEED_DATA.orders.length; i++) {
    const orderSpec = SEED_DATA.orders[i];
    SEED_STATE.stats.totalAttempts++;

    const warehouse = SEED_STATE.warehouses[orderSpec.warehouseIndex] || { id: orderSpec.warehouseIndex + 1 };
    const items = orderSpec.itemRefs.map(ref => {
      const prod = SEED_STATE.products[ref.productIndex] || { id: ref.productIndex + 101 };
      return {
        productId: prod.id,
        quantity: ref.quantity
      };
    });

    const payload = {
      customerName: orderSpec.customerName,
      customerEmail: orderSpec.customerEmail,
      deliveryAddress: orderSpec.deliveryAddress,
      warehouseId: warehouse.id,
      items: items
    };

    const preVal = validatePreSend('ORDER', payload);
    if (!preVal.valid) {
      SEED_STATE.stats.preValFails++;
      continue;
    }
    SEED_STATE.stats.preValPasses++;

    logger.info(`Creating Order for Customer: '${orderSpec.customerName}' | Warehouse #${warehouse.id} | Items: ${items.length}`);
    const res = await httpRequest('POST', '/api/orders', payload);

    const postAssert = assertPostResponse('ORDER', res, { checkId: true });
    if (!postAssert.valid) {
      SEED_STATE.stats.postAssertFails++;
    } else {
      SEED_STATE.stats.postAssertPasses++;
      const orderId = (res.data && res.data.id) ? res.data.id : (i + 1001);
      const order = { id: orderId, orderNumber: `ORD-${10000 + i}`, ...payload, ...(res.data || {}) };
      SEED_STATE.orders.push(order);
      logger.success(`Order seeded successfully (ID: ${order.id}, Order#: ${order.orderNumber})`);
    }
  }
}

module.exports = phase6_Orders;
