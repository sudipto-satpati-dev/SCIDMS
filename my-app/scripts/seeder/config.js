/**
 * SCIDMS Seeder — CLI Arguments & Environment Configuration
 */

const args = process.argv.slice(2).reduce((acc, arg) => {
  if (arg.startsWith('--')) {
    const [key, value] = arg.slice(2).split('=');
    acc[key] = value !== undefined ? value : true;
  }
  return acc;
}, {});

const CONFIG = {
  baseUrl: (args.url || process.env.API_BASE_URL || 'http://localhost:8080').replace(/\/+$/, ''),
  adminUser: args['admin-user'] || process.env.SEED_ADMIN_USER || 'admin',
  adminPass: args['admin-pass'] || process.env.SEED_ADMIN_PASS || 'admin123',
  dryRun: Boolean(args['dry-run']),
  verbose: Boolean(args.verbose),
};

module.exports = CONFIG;
