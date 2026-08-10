/**
 * Phase 1: User Account Seeding
 */

const logger = require('../logger');
const SEED_DATA = require('../seed-data');
const SEED_STATE = require('../seed-state');
const { httpRequest } = require('../http-client');
const { validatePreSend, assertPostResponse } = require('../validators');

async function phase1_Users() {
  logger.phase(1, 'Seeding User Accounts');

  for (const userSpec of SEED_DATA.users) {
    SEED_STATE.stats.totalAttempts++;

    const preVal = validatePreSend('USER', userSpec);
    if (!preVal.valid) {
      SEED_STATE.stats.preValFails++;
      continue;
    }
    SEED_STATE.stats.preValPasses++;

    logger.info(`Creating User [${userSpec.role}]: ${userSpec.username} (${userSpec.email})`);
    const res = await httpRequest('POST', '/api/users', userSpec);

    const postAssert = assertPostResponse('USER', res, { checkId: true });
    if (!postAssert.valid) {
      SEED_STATE.stats.postAssertFails++;
    } else {
      SEED_STATE.stats.postAssertPasses++;
      const createdUser = res.data || { id: Date.now(), ...userSpec };
      SEED_STATE.users.push(createdUser);
      logger.success(`User '${userSpec.username}' seeded (ID: ${createdUser.id || 'N/A'})`);
    }
  }
}

module.exports = phase1_Users;
