/**
 * Next.js Instrumentation
 * Initializes monitoring and analytics services
 *
 * Note: Sentry configuration is currently disabled
 */

export async function register() {
  // Sentry initialization is disabled for now
  // Uncomment and configure when Sentry is needed

  // if (process.env.NEXT_RUNTIME === 'nodejs') {
  //   await import('./sentry.server.config');
  // }

  // if (process.env.NEXT_RUNTIME === 'edge') {
  //   await import('./sentry.edge.config');
  // }

  console.log('Instrumentation registered successfully');
}