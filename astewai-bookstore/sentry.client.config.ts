/**
 * Sentry Client Configuration
 * Error tracking and performance monitoring for client-side
 */

import * as Sentry from '@sentry/nextjs';
import { analyticsConfig } from './src/lib/analytics/config';

if (analyticsConfig.sentry.enabled) {
  Sentry.init({
    dsn: analyticsConfig.sentry.dsn,
    environment: analyticsConfig.sentry.environment,
    
    // Performance Monitoring
    tracesSampleRate: analyticsConfig.sentry.tracesSampleRate,
    
    // Profiling
    profilesSampleRate: analyticsConfig.sentry.profilesSampleRate,
    
    // Session Replay
    replaysSessionSampleRate: 0.1, // 10% of sessions
    replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors
    
    // Additional Options
    debug: process.env.NODE_ENV === 'development',
    
    // Filter out noise
    beforeSend(event, hint) {
      // Filter out common browser errors that aren't actionable
      const error = hint.originalException;
      
      if (error && typeof error === 'object' && 'message' in error) {
        const message = error.message as string;
        
        // Filter out common browser extension errors
        if (
          message.includes('Non-Error promise rejection captured') ||
          message.includes('ResizeObserver loop limit exceeded') ||
          message.includes('Script error') ||
          message.includes('Network request failed')
        ) {
          return null;
        }
      }
      
      return event;
    },
    
    // Set user context
    initialScope: {
      tags: {
        component: 'client',
      },
    },
    
    // Integrations
    integrations: [
      Sentry.replayIntegration({
        // Mask all text and input content
        maskAllText: true,
        maskAllInputs: true,
        // Don't record canvas or media elements
        blockAllMedia: true,
      }),
    ],
  });
}