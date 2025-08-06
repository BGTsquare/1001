/**
 * Sentry Server Configuration
 * Error tracking and performance monitoring for server-side
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
    
    // Additional Options
    debug: process.env.NODE_ENV === 'development',
    
    // Server-specific options
    beforeSend(event, hint) {
      // Filter out common server errors that aren't actionable
      const error = hint.originalException;
      
      if (error && typeof error === 'object' && 'message' in error) {
        const message = error.message as string;
        
        // Filter out common connection errors
        if (
          message.includes('ECONNRESET') ||
          message.includes('ENOTFOUND') ||
          message.includes('ETIMEDOUT')
        ) {
          return null;
        }
      }
      
      return event;
    },
    
    // Set server context
    initialScope: {
      tags: {
        component: 'server',
      },
    },
  });
}