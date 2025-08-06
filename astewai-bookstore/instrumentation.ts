/**
 * Next.js Instrumentation
 * Initializes monitoring and analytics services
 */

export async function register() {
  // Initialize Sentry on server startup
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config');
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config');
  }
}