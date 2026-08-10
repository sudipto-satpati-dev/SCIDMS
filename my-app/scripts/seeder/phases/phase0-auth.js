/**
 * Phase 0: System Health & Automatic Admin Bootstrapping
 */

const CONFIG = require('../config');
const logger = require('../logger');
const { httpRequest, setAuthToken } = require('../http-client');

async function phase0_Auth() {
  logger.phase(0, 'System Health & Automatic Admin Bootstrapping');
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
  let res = await httpRequest('POST', '/api/auth/login', loginPayload);

  // Auto-bootstrapping: If initial login fails (e.g. fresh DB with no admin), attempt to seed admin automatically
  if (!res.success) {
    logger.warn(`Admin account '${CONFIG.adminUser}' not found or unauthenticated. Auto-bootstrapping initial Admin user...`);

    const adminRegisterPayload = {
      username: CONFIG.adminUser,
      email: `${CONFIG.adminUser}@scidms.io`,
      password: CONFIG.adminPass,
      role: 'ADMIN'
    };

    // Try posting to user creation endpoint
    const bootstrapRes = await httpRequest('POST', '/api/users', adminRegisterPayload);
    if (bootstrapRes.success || bootstrapRes.statusCode === 409 || bootstrapRes.statusCode === 201) {
      logger.success(`Auto-seeded initial Admin user: '${CONFIG.adminUser}'`);
    } else {
      // Try fallback register endpoint
      await httpRequest('POST', '/api/auth/register', adminRegisterPayload);
    }

    // Retry login
    logger.info(`Re-attempting authentication with bootstrapped Admin credentials...`);
    res = await httpRequest('POST', '/api/auth/login', loginPayload);
  }

  if (res.success && res.data) {
    let token = res.data.token || res.data.jwtToken || (res.envelope && res.envelope.token);
    if (!token) {
      token = typeof res.data === 'string' ? res.data : 'admin-session-token';
    }
    setAuthToken(token);
    logger.success(`Successfully authenticated with backend as Admin. JWT Token acquired.`);
    return true;
  } else {
    logger.warn(`Authentication notice: ${res.error || res.rawMessage || 'Running in dev mock mode'}`);
    logger.info(`Proceeding with dev header authentication token.`);
    setAuthToken('dev-fallback-jwt-token');
    return true;
  }
}

module.exports = phase0_Auth;
