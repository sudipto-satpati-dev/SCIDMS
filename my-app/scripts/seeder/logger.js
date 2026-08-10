/**
 * SCIDMS Seeder — ANSI Terminal Logger & Formatter
 */

const CONFIG = require('./config');

const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bgBlue: '\x1b[44m',
  bgGreen: '\x1b[42m',
  bgRed: '\x1b[41m'
};

const logger = {
  banner: (title) => {
    console.log('\n' + COLORS.cyan + COLORS.bright + '='.repeat(80) + COLORS.reset);
    console.log(COLORS.cyan + COLORS.bright + `  ${title.toUpperCase()}` + COLORS.reset);
    console.log(COLORS.cyan + COLORS.bright + '='.repeat(80) + COLORS.reset);
  },
  phase: (phaseNum, name) => {
    console.log(`\n${COLORS.magenta}${COLORS.bright}▶ PHASE ${phaseNum}: ${name}${COLORS.reset}`);
    console.log(COLORS.dim + '─'.repeat(80) + COLORS.reset);
  },
  info: (msg) => console.log(`${COLORS.blue}ℹ${COLORS.reset}  ${msg}`),
  success: (msg) => console.log(`${COLORS.green}✔${COLORS.reset}  ${msg}`),
  warn: (msg) => console.log(`${COLORS.yellow}⚠${COLORS.reset}  ${msg}`),
  error: (msg) => console.log(`${COLORS.red}✖${COLORS.reset}  ${msg}`),
  valPass: (msg) => console.log(`   ${COLORS.dim}[Pre-Check OK]${COLORS.reset} ${msg}`),
  valFail: (msg) => console.log(`   ${COLORS.red}${COLORS.bright}[PRE-SEND VALIDATION ERROR]${COLORS.reset} ${msg}`),
  assertPass: (msg) => console.log(`   ${COLORS.green}[Post-Assert OK]${COLORS.reset} ${msg}`),
  assertFail: (msg) => console.log(`   ${COLORS.red}${COLORS.bright}[POST-RESPONSE ASSERTION ERROR]${COLORS.reset} ${msg}`),
  debug: (obj) => {
    if (CONFIG.verbose) {
      console.log(COLORS.dim + JSON.stringify(obj, null, 2) + COLORS.reset);
    }
  },
  COLORS
};

module.exports = logger;
