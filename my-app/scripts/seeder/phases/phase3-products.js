/**
 * Phase 3: Product Catalog Seeding
 */

const logger = require('../logger');
const SEED_DATA = require('../seed-data');
const SEED_STATE = require('../seed-state');
const { httpRequest, logAudit } = require('../http-client');
const { validatePreSend, assertPostResponse } = require('../validators');

async function phase3_Products() {
  logger.phase(3, 'Seeding Product Catalog');

  for (let i = 0; i < SEED_DATA.products.length; i++) {
    const prodSpec = SEED_DATA.products[i];
    SEED_STATE.stats.totalAttempts++;

    const categoryObj = SEED_STATE.categories[prodSpec.categoryIndex] || { id: prodSpec.categoryIndex + 1 };
    const payload = {
      name: prodSpec.name,
      categoryId: categoryObj.id,
      unitPrice: prodSpec.unitPrice,
      lowStockThreshold: prodSpec.lowStockThreshold
    };

    const preVal = validatePreSend('PRODUCT', payload);
    if (!preVal.valid) {
      SEED_STATE.stats.preValFails++;
      continue;
    }
    SEED_STATE.stats.preValPasses++;

    logger.info(`Creating Product: '${payload.name}' | Price: $${payload.unitPrice} | Category ID: ${payload.categoryId}`);
    const res = await httpRequest('POST', '/api/products', payload);

    const postAssert = assertPostResponse('PRODUCT', res, { checkId: true });
    if (!postAssert.valid) {
      SEED_STATE.stats.postAssertFails++;
    } else {
      SEED_STATE.stats.postAssertPasses++;
      const productId = (res.data && res.data.id) ? res.data.id : (i + 101);
      const product = { id: productId, sku: `SKU-IND-${1000 + i}`, ...payload, ...(res.data || {}) };
      SEED_STATE.products.push(product);
      logger.success(`Product '${product.name}' seeded (ID: ${product.id}, SKU: ${product.sku})`);

      // Post Audit Log to Audit Table
      await logAudit('PRODUCT_CREATED', 'PRODUCT_MANAGEMENT', 'PRODUCT', product.id, `Seeded product '${product.name}' (SKU: ${product.sku}, Price: $${product.unitPrice})`);
    }
  }
}

module.exports = phase3_Products;
