/**
 * Sentry Edge Runtime Configuration
 * Error tracking for Edge Runtime functions
 */

import * as Sentry from '@sentry/nextjs';
import { analyticsConfig } from './src/lib/analytics/config';

if (analyticsConfig.sentry.enabled) {
  Sentry.init({
    dsn: analyticsConfig.sentry.dsn,
    environment: analyticsConfig.sentry.environment,
    
    // Performance Monitoring (reduced for edge)
    tracesSampleRate: analyticsConfig.sentry.tracesSampleRate * 0.5,
    
    // Additional Options
    debug: process.env.NODE_ENV === 'development',
    
    // Edge-specific options
    beforeSend(event, hint) {
      // Filter out edge-specific errors that aren't actionable
      const error = hint.originalException;
      
      if (error && typeof error === 'object' && 'message' in error) {
        const message = error.message as string;
        
        // Filter out edge runtime limitations
        if (
          message.includes('Dynamic Code Evaluation') ||
          message.includes('Edge Runtime')
        ) {
          return null;
        }
      }
      
      return event;
    },
    
    // Set edge context
    initialScope: {
      tags: {
        component: 'edge',
      },
    },
  });
}