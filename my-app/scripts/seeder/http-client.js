/**
 * SCIDMS Seeder — HTTP Client with JWT Token Injection
 */

const http = require('http');
const https = require('https');
const { URL } = require('url');
const CONFIG = require('./config');
const logger = require('./logger');

let authToken = null;

function setAuthToken(token) {
  authToken = token;
}

function getAuthToken() {
  return authToken;
}

async function httpRequest(method, path, body = null) {
  const fullUrl = `${CONFIG.baseUrl}${path}`;
  
  if (CONFIG.dryRun && method !== 'GET') {
    logger.info(`[DRY RUN] Skipping ${method} ${fullUrl}`);
    return { success: true, statusCode: 200, data: { dryRun: true }, message: 'Dry run execution simulated' };
  }

  const urlObj = new URL(fullUrl);
  const isHttps = urlObj.protocol === 'https:';
  const transport = isHttps ? https : http;

  const payload = body ? JSON.stringify(body) : null;
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };

  if (payload) {
    headers['Content-Length'] = Buffer.byteLength(payload);
  }

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  return new Promise((resolve) => {
    const reqOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: headers,
      timeout: 10000
    };

    const req = transport.request(reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        let parsedData = null;
        try {
          parsedData = data ? JSON.parse(data) : {};
        } catch (e) {
          parsedData = { rawText: data };
        }

        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: parsedData.data !== undefined ? parsedData.data : parsedData,
          envelope: parsedData,
          success: res.statusCode >= 200 && res.statusCode < 300 && (parsedData.success === undefined || parsedData.success === true),
          rawMessage: parsedData.message || res.statusMessage
        });
      });
    });

    req.on('error', (err) => {
      resolve({
        statusCode: 0,
        success: false,
        error: err.message,
        data: null
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        statusCode: 408,
        success: false,
        error: 'Request Timeout (10s)',
        data: null
      });
    });

    if (payload) {
      req.write(payload);
    }
    req.end();
  });
}

module.exports = {
  httpRequest,
  setAuthToken,
  getAuthToken
};
