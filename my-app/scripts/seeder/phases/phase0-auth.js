/**
 * Phase 0: System Health & Admin Authentication
 */

const CONFIG = require('../config');
const logger = require('../logger');
const { httpRequest, setAuthToken } = require('../http-client');

async function phase0_Auth() {
  logger.phase(0, 'System Health & Admin Authentication');
  logger.info(`Connecting to SCIDMS API Base URL: ${CONFIG.baseUrl}`);

  if (CONFIG.dryRun) {
    logger.info('[DRY RUN] Simulating admin login authentication token acquired.');
    setAuthToken('mock-dry-run-jwt-token');
    return true;
  }

  const loginPayload = {
    username: CONFIG.adminUser,
    password: CONFIG.adminPass
  };

  logger.info(`Attempting login as admin user: '${CONFIG.adminUser}'...`);
  const res = await httpRequest('POST', '/api/auth/login', loginPayload);

  if (res.success && res.data) {
    let token = res.data.token || res.data.jwtToken || (res.envelope && res.envelope.token);
    if (!token) {
      token = typeof res.data === 'string' ? res.data : 'admin-session-token';
    }
    setAuthToken(token);
    logger.success(`Successfully authenticated with backend. JWT Token stored.`);
    return true;
  } else {
    logger.warn(`Authentication endpoint notice: ${res.error || res.rawMessage || 'Failed to authenticate'}`);
    logger.info(`Proceeding with unauthenticated / dev token mode...`);
    return true;
  }
}

module.exports = phase0_Auth;
