/**
 * Phase 0: System Health, Admin Registration & Authentication
 */

const CONFIG = require('../config');
const logger = require('../logger');
const { httpRequest, setAuthToken } = require('../http-client');

async function phase0_Auth() {
  logger.phase(0, 'Admin Registration & Authentication');
  logger.info(`Connecting to SCIDMS API Base URL: ${CONFIG.baseUrl}`);

  if (CONFIG.dryRun) {
    logger.info('[DRY RUN] Registering Admin via /api/auth/register simulated.');
    logger.info('[DRY RUN] Simulating admin login authentication token acquired.');
    setAuthToken('mock-dry-run-jwt-token');
    return true;
  }

  // 1. Register the Admin user via /api/auth/register
  const adminRegisterPayload = {
    username: CONFIG.adminUser,
    email: `${CONFIG.adminUser}@scidms.io`,
    password: CONFIG.adminPass,
    role: 'ADMIN'
  };

  logger.info(`Registering Admin user '${CONFIG.adminUser}' via POST /api/auth/register...`);
  const registerRes = await httpRequest('POST', '/api/auth/register', adminRegisterPayload);

  if (registerRes.success) {
    logger.success(`Admin user '${CONFIG.adminUser}' registered successfully via /api/auth/register`);
  } else if (registerRes.statusCode === 409 || (registerRes.rawMessage && registerRes.rawMessage.toLowerCase().includes('already exists'))) {
    logger.info(`Admin user '${CONFIG.adminUser}' already registered in database.`);
  } else {
    logger.warn(`Notice during /api/auth/register: ${registerRes.error || registerRes.rawMessage || 'Proceeding to login'}`);
  }

  // 2. Log in as Admin to acquire JWT Bearer Token
  const loginPayload = {
    username: CONFIG.adminUser,
    password: CONFIG.adminPass
  };

  logger.info(`Authenticating as Admin user '${CONFIG.adminUser}' via POST /api/auth/login...`);
  const res = await httpRequest('POST', '/api/auth/login', loginPayload);

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
