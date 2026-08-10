/**
 * Phase 4: Warehouse Facility Seeding
 */

const logger = require('../logger');
const SEED_DATA = require('../seed-data');
const SEED_STATE = require('../seed-state');
const { httpRequest } = require('../http-client');
const { validatePreSend, assertPostResponse } = require('../validators');

async function phase4_Warehouses() {
  logger.phase(4, 'Seeding Warehouse Facilities');

  for (let i = 0; i < SEED_DATA.warehouses.length; i++) {
    const whSpec = SEED_DATA.warehouses[i];
    SEED_STATE.stats.totalAttempts++;

    const managerObj = SEED_STATE.users[whSpec.managerUserIndex] || { id: 1 };
    const payload = {
      name: whSpec.name,
      location: whSpec.location,
      totalCapacity: whSpec.totalCapacity
    };

    const preVal = validatePreSend('WAREHOUSE', payload);
    if (!preVal.valid) {
      SEED_STATE.stats.preValFails++;
      continue;
    }
    SEED_STATE.stats.preValPasses++;

    logger.info(`Creating Warehouse: '${whSpec.name}' (${whSpec.location}) | Capacity: ${whSpec.totalCapacity} units`);
    const res = await httpRequest('POST', '/api/warehouses', payload);

    const postAssert = assertPostResponse('WAREHOUSE', res, { checkId: true });
    if (!postAssert.valid) {
      SEED_STATE.stats.postAssertFails++;
    } else {
      SEED_STATE.stats.postAssertPasses++;
      const warehouseId = (res.data && res.data.id) ? res.data.id : (i + 1);
      const warehouse = { id: warehouseId, ...payload, ...(res.data || {}) };
      SEED_STATE.warehouses.push(warehouse);
      logger.success(`Warehouse '${warehouse.name}' seeded (ID: ${warehouse.id})`);
    }
  }
}

module.exports = phase4_Warehouses;
