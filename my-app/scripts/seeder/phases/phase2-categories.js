/**
 * Phase 2: Category Seeding
 */

const logger = require('../logger');
const SEED_DATA = require('../seed-data');
const SEED_STATE = require('../seed-state');
const { httpRequest, logAudit } = require('../http-client');
const { validatePreSend, assertPostResponse } = require('../validators');

async function phase2_Categories() {
  logger.phase(2, 'Seeding Product Categories');

  for (let i = 0; i < SEED_DATA.categories.length; i++) {
    const catSpec = SEED_DATA.categories[i];
    SEED_STATE.stats.totalAttempts++;

    const preVal = validatePreSend('CATEGORY', catSpec);
    if (!preVal.valid) {
      SEED_STATE.stats.preValFails++;
      continue;
    }
    SEED_STATE.stats.preValPasses++;

    logger.info(`Creating Category: ${catSpec.name}`);
    const res = await httpRequest('POST', '/api/categories', catSpec);

    const postAssert = assertPostResponse('CATEGORY', res, { checkId: true });
    if (!postAssert.valid) {
      SEED_STATE.stats.postAssertFails++;
    } else {
      SEED_STATE.stats.postAssertPasses++;
      const categoryId = (res.data && res.data.id) ? res.data.id : (i + 1);
      const category = { id: categoryId, ...catSpec, ...(res.data || {}) };
      SEED_STATE.categories.push(category);
      logger.success(`Category '${catSpec.name}' seeded (ID: ${category.id})`);

      // Post Audit Log to Audit Table
      await logAudit('CATEGORY_CREATED', 'PRODUCT_MANAGEMENT', 'CATEGORY', category.id, `Seeded product category '${catSpec.name}'`);
    }
  }
}

module.exports = phase2_Categories;
