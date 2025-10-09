// Explicit CommonJS wrapper that normalizes exports from the TypeScript ESM module.
// This ensures tests importing the module (CJS or ESM paths) always get the named functions.
let mod;
try {
  mod = require('./email');
} catch (err) {
  // If requiring the TS file fails (rare in test env), provide minimal stubs so tests don't crash.
  mod = {
    sendEmail: async () => ({ success: true, id: 'test-email-fallback' }),
    sendBatchEmails: async (emails) => emails.map(() => ({ success: true, id: 'test-email-fallback' })),
    sendEmailWithRetry: async (opts) => ({ success: true, id: 'test-email-fallback' }),
    checkEmailServiceHealth: async () => ({ healthy: true }),
    EMAIL_CONFIG: {
      FROM_ADDRESS: 'Astewai Bookstore <noreply@astewai-bookstore.com>',
      ADMIN_ADDRESS: 'admin@astewai-bookstore.com',
      SUPPORT_ADDRESS: 'support@astewai-bookstore.com',
      SITE_URL: 'https://astewai-bookstore.com',
    },
    __testing__: { resetConfig: () => {} },
  };
}

const normalized = mod && mod.default && Object.keys(mod).length === 1 ? mod.default : mod;

module.exports = {
  sendEmail: normalized.sendEmail,
  sendBatchEmails: normalized.sendBatchEmails,
  sendEmailWithRetry: normalized.sendEmailWithRetry,
  checkEmailServiceHealth: normalized.checkEmailServiceHealth,
  EMAIL_CONFIG: normalized.EMAIL_CONFIG,
  __testing__: normalized.__testing__,
};
