/**
 * SCIDMS Seeder — Pre-Send Payload Validator & Post-Response Assertion Engine
 */

const CONFIG = require('./config');
const logger = require('./logger');

/**
 * Client-Side Pre-Send Validator
 * Checks types, ranges, pattern formats, and required fields before sending HTTP requests.
 */
function validatePreSend(entityType, payload) {
  const errors = [];

  const isEmail = (str) => typeof str === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str);
  const isNonEmpty = (str) => typeof str === 'string' && str.trim().length > 0;
  const isPositiveNum = (n) => typeof n === 'number' && !isNaN(n) && n > 0;
  const isNonNegativeNum = (n) => typeof n === 'number' && !isNaN(n) && n >= 0;

  switch (entityType) {
    case 'USER':
      if (!isNonEmpty(payload.username)) errors.push('username must be a non-empty string');
      if (!isEmail(payload.email)) errors.push(`email standard format required (got: ${payload.email})`);
      if (!isNonEmpty(payload.password) || payload.password.length < 4) errors.push('password must be at least 4 characters');
      const validRoles = ['ADMIN', 'WAREHOUSE MANAGER', 'SALES EXECUTIVE', 'DISTRIBUTION MANAGER', 'MANAGER', 'PRODUCT MANAGER'];
      if (!validRoles.includes(payload.role)) errors.push(`role must be one of [${validRoles.join(', ')}]`);
      break;

    case 'CATEGORY':
      if (!isNonEmpty(payload.name)) errors.push('category name must be non-empty');
      if (!isNonEmpty(payload.description)) errors.push('category description must be non-empty');
      break;

    case 'PRODUCT':
      if (!isNonEmpty(payload.name)) errors.push('product name must be non-empty');
      if (!isPositiveNum(payload.categoryId)) errors.push(`categoryId must be a valid positive number (got: ${payload.categoryId})`);
      if (!isPositiveNum(payload.unitPrice)) errors.push(`unitPrice must be > 0 (got: ${payload.unitPrice})`);
      if (!isNonNegativeNum(payload.lowStockThreshold)) errors.push(`lowStockThreshold must be >= 0 (got: ${payload.lowStockThreshold})`);
      break;

    case 'WAREHOUSE':
      if (!isNonEmpty(payload.name)) errors.push('warehouse name must be non-empty');
      if (!isNonEmpty(payload.location)) errors.push('warehouse location must be non-empty');
      if (!isPositiveNum(payload.totalCapacity)) errors.push(`totalCapacity must be > 0 (got: ${payload.totalCapacity})`);
      break;

    case 'INVENTORY_RECEIVE':
      if (!payload.productId) errors.push('productId is required');
      if (!payload.warehouseId) errors.push('warehouseId is required');
      if (!isPositiveNum(payload.quantity)) errors.push(`quantity must be > 0 (got: ${payload.quantity})`);
      if (!isNonEmpty(payload.referenceNumber)) errors.push('referenceNumber is required');
      break;

    case 'ORDER':
      if (!isNonEmpty(payload.customerName)) errors.push('customerName must be non-empty');
      if (!isEmail(payload.customerEmail)) errors.push(`customerEmail must be valid email (got: ${payload.customerEmail})`);
      if (!isNonEmpty(payload.deliveryAddress)) errors.push('deliveryAddress must be non-empty');
      if (!payload.warehouseId) errors.push('warehouseId is required');
      if (!Array.isArray(payload.items) || payload.items.length === 0) {
        errors.push('items array must contain at least one line item');
      } else {
        payload.items.forEach((item, i) => {
          if (!item.productId) errors.push(`items[${i}].productId is required`);
          if (!isPositiveNum(item.quantity)) errors.push(`items[${i}].quantity must be > 0`);
        });
      }
      break;

    case 'SHIPMENT':
      if (!payload.orderId) errors.push('orderId is required');
      if (!isNonEmpty(payload.carrierName)) errors.push('carrierName must be non-empty');
      if (!isNonEmpty(payload.trackingNumber)) errors.push('trackingNumber must be non-empty');
      if (!isNonEmpty(payload.expectedDeliveryDate)) errors.push('expectedDeliveryDate must be ISO date string');
      break;

    default:
      break;
  }

  if (errors.length > 0) {
    logger.valFail(`${entityType} Payload check failed:\n      - ${errors.join('\n      - ')}`);
    return { valid: false, errors };
  }

  logger.valPass(`${entityType} Payload validated successfully`);
  return { valid: true, errors: [] };
}

/**
 * Server Response Assertion Verification Engine
 * Asserts HTTP status codes, envelope success status, and structural output integrity.
 */
function assertPostResponse(entityType, res, expectedAssertions = {}) {
  const errors = [];

  if (CONFIG.dryRun) {
    logger.assertPass(`${entityType} [DRY RUN] Assertion simulated clean response`);
    return { valid: true, errors: [] };
  }

  // 1. HTTP Status assertion
  if (res.statusCode < 200 || res.statusCode >= 300) {
    errors.push(`Expected HTTP 2xx status code, received ${res.statusCode} (${res.error || res.rawMessage || 'Unknown error'})`);
  }

  // 2. Success Envelope assertion
  if (res.envelope && res.envelope.success === false) {
    errors.push(`API response envelope reported success: false ("${res.rawMessage}")`);
  }

  // 3. Entity structural assertion
  const entityData = res.data;
  if (!entityData && res.statusCode >= 200 && res.statusCode < 300) {
    errors.push('Response body data object is missing or null');
  } else if (entityData) {
    if (expectedAssertions.checkId && entityData.id === undefined && entityData.inventoryId === undefined && entityData.referenceNumber === undefined) {
      errors.push('Response entity is missing unique identifier field (id/inventoryId/referenceNumber)');
    }

    if (expectedAssertions.expectedStatus && entityData.status && entityData.status !== expectedAssertions.expectedStatus) {
      errors.push(`Expected entity status '${expectedAssertions.expectedStatus}', got '${entityData.status}'`);
    }
  }

  if (errors.length > 0) {
    logger.assertFail(`${entityType} Response Assertion failed:\n      - ${errors.join('\n      - ')}`);
    return { valid: false, errors };
  }

  logger.assertPass(`${entityType} API Response verified (HTTP ${res.statusCode})`);
  return { valid: true, errors: [] };
}

module.exports = {
  validatePreSend,
  assertPostResponse
};
