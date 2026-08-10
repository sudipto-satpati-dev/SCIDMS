/**
 * Phase 7: Order Approval & Logistics Shipment Seeding
 */

const logger = require('../logger');
const SEED_DATA = require('../seed-data');
const SEED_STATE = require('../seed-state');
const { httpRequest } = require('../http-client');
const { validatePreSend, assertPostResponse } = require('../validators');

async function phase7_ApprovalAndShipments() {
  logger.phase(7, 'Seeding Order Approvals & Logistics Shipments');

  for (let i = 0; i < SEED_STATE.orders.length; i++) {
    const order = SEED_STATE.orders[i];
    const shipmentSpec = SEED_DATA.shipments[i] || {
      carrierName: 'Standard Courier',
      trackingNumber: `TRK-${Date.now()}-${i}`
    };

    // 1. Approve Order
    logger.info(`Approving Order #${order.id} (${order.orderNumber || 'Pending'})...`);
    const approveRes = await httpRequest('POST', `/api/orders/${order.id}/approve`, {});
    assertPostResponse('ORDER_APPROVAL', approveRes, { expectedStatus: 'APPROVED' });

    // 2. Dispatch Shipment
    SEED_STATE.stats.totalAttempts++;
    const nextWeekIso = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const shipmentPayload = {
      orderId: order.id,
      carrierName: shipmentSpec.carrierName,
      trackingNumber: shipmentSpec.trackingNumber,
      expectedDeliveryDate: nextWeekIso
    };

    const preVal = validatePreSend('SHIPMENT', shipmentPayload);
    if (!preVal.valid) {
      SEED_STATE.stats.preValFails++;
      continue;
    }
    SEED_STATE.stats.preValPasses++;

    logger.info(`Dispatching Shipment for Order #${order.id} via '${shipmentPayload.carrierName}' (Tracking: ${shipmentPayload.trackingNumber})`);
    const shipmentRes = await httpRequest('POST', '/api/shipments', shipmentPayload);

    const postAssert = assertPostResponse('SHIPMENT', shipmentRes, { checkId: true });
    if (!postAssert.valid) {
      SEED_STATE.stats.postAssertFails++;
    } else {
      SEED_STATE.stats.postAssertPasses++;
      const shipmentId = (shipmentRes.data && shipmentRes.data.id) ? shipmentRes.data.id : (i + 501);
      const shipment = { id: shipmentId, shipmentNumber: `SHP-${20000 + i}`, ...shipmentPayload, ...(shipmentRes.data || {}) };
      SEED_STATE.shipments.push(shipment);
      logger.success(`Shipment created (ID: ${shipment.id}, Shipment#: ${shipment.shipmentNumber})`);
    }
  }
}

module.exports = phase7_ApprovalAndShipments;
