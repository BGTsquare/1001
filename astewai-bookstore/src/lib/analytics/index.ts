/**
 * Analytics Service
 * Unified interface for all analytics providers
 */

import { analyticsConfig, type AnalyticsEvent } from './config';
import { VercelAnalyticsProvider } from './providers/vercel-provider';
import { PlausibleAnalyticsProvider } from './providers/plausible-provider';
// Temporarily disabled Sentry to fix import issues
// import { SentryAnalyticsProvider } from './providers/sentry-provider';
import { AnalyticsQueueManager } from './queue-manager';
import type { AnalyticsEventData, ConversionData } from './providers/base-provider';

// Constants for better maintainability
const LOG_EMOJIS = {
  EVENT: '📊',
  PAGE_VIEW: '📄',
  CONVERSION: '💰',
  USER: '👤',
  PERFORMANCE: '⚡',
  ERROR: '🚨',
} as const;

// Re-export types for convenience
export type { AnalyticsEventData, ConversionData };

// Lazy provider initialization (Sentry temporarily disabled)
let providers: (VercelAnalyticsProvider | PlausibleAnalyticsProvider)[] | null = null;

function getProviders() {
  if (!providers) {
    providers = [
      new VercelAnalyticsProvider(analyticsConfig.vercel),
      new PlausibleAnalyticsProvider(analyticsConfig.plausible),
      // Temporarily disabled: new SentryAnalyticsProvider(analyticsConfig.sentry),
    ].filter(provider => provider.isEnabled());
  }
  return providers;
}

/**
 * Utility function to execute provider operations with consistent error handling
 * @param operation - The operation to execute on each provider
 * @param operationName - Name of the operation for logging purposes
 * @param logData - Data to include in development logs
 */
async function executeProviderOperation<T>(
  operation: (provider: VercelAnalyticsProvider | PlausibleAnalyticsProvider) => Promise<T>,
  operationName: string,
  logData?: Record<string, unknown>
): Promise<void> {
  const activeProviders = getProviders();
  const promises = activeProviders.map(async (provider) => {
    try {
      await operation(provider);
      
      // Log in development
      if (process.env.NODE_ENV === 'development' || analyticsConfig.general.enableInDevelopment) {
        const emoji = LOG_EMOJIS.EVENT;
        console.log(`${emoji} ${operationName} (${provider.constructor.name}):`, logData);
      }
    } catch (error) {
      console.error(`${operationName} error in ${provider.constructor.name}:`, error);
      
      // Sentry error reporting temporarily disabled
      console.error(`Analytics provider error in ${provider.constructor.name}:`, error);
    }
  });

  await Promise.allSettled(promises);
}

// Initialize queue manager
const queueManager = new AnalyticsQueueManager(async (events) => {
  const promises = events.map(async ({ event, data }) => {
    const activeProviders = getProviders();
    const providerPromises = activeProviders.map(async (provider) => {
      try {
        await provider.trackEvent(event, data);
        
        // Log in development
        if (process.env.NODE_ENV === 'development' || analyticsConfig.general.enableInDevelopment) {
          console.log(`${LOG_EMOJIS.EVENT} Analytics Event (${provider.constructor.name}):`, event, data);
        }
      } catch (error) {
        console.error(`Analytics error in ${provider.constructor.name}:`, error);
        
        // Sentry error reporting temporarily disabled
        console.error(`Analytics queue error in ${provider.constructor.name}:`, error);
        
        throw error; // Re-throw for queue retry logic
      }
    });

    // Wait for all providers to complete (or fail)
    await Promise.allSettled(providerPromises);
  });

  await Promise.allSettled(promises);
});

/**
 * Track custom analytics events
 * @param event - The event name or predefined analytics event
 * @param data - Optional event data
 */
export function trackEvent(
  event: AnalyticsEvent | string,
  data?: AnalyticsEventData
): void {
  queueManager.enqueue(event, data);
}

/**
 * Track page views
 */
export async function trackPageView(url: string, title?: string): Promise<void> {
  try {
    await executeProviderOperation(
      (provider) => provider.trackPageView(url, title),
      'Page View',
      { url, title }
    );
  } catch (error) {
    console.error('Page view tracking error:', error);
  }
}

/**
 * Track conversions (purchases, signups, etc.)
 */
export async function trackConversion(
  event: AnalyticsEvent | string,
  data: ConversionData
): Promise<void> {
  try {
    // Enhanced tracking for conversions
    const conversionData = {
      ...data,
      timestamp: new Date().toISOString(),
      user_agent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
    };

    await executeProviderOperation(
      (provider) => provider.trackConversion(event, conversionData),
      'Conversion',
      { event, data: conversionData }
    );
  } catch (error) {
    console.error('Conversion tracking error:', error);
  }
}

/**
 * Track user identification for analytics
 */
export async function identifyUser(userId: string, traits?: Record<string, any>): Promise<void> {
  try {
    await executeProviderOperation(
      (provider) => provider.identifyUser(userId, traits),
      'User Identification',
      { userId, traits }
    );
  } catch (error) {
    console.error('User identification error:', error);
  }
}

/**
 * Track performance metrics
 */
export function trackPerformance(metric: string, value: number, unit = 'ms'): void {
  try {
    const performanceData = {
      metric,
      value,
      unit,
      timestamp: new Date().toISOString(),
      url: typeof window !== 'undefined' ? window.location.pathname : undefined,
    };

    trackEvent('performance_metric', performanceData);

    if (process.env.NODE_ENV === 'development') {
      console.log(`${LOG_EMOJIS.PERFORMANCE} Performance Metric:`, performanceData);
    }
  } catch (error) {
    console.error('Performance tracking error:', error);
  }
}

/**
 * Track errors (non-fatal)
 */
export function trackError(error: Error, context?: Record<string, any>): void {
  try {
    // Sentry provider temporarily disabled - just log errors
    console.error('Error tracked:', error.message, context);

    // Track as analytics event
    trackEvent('error_occurred', {
      error_message: error.message,
      error_name: error.name,
      ...context,
    });

    if (process.env.NODE_ENV === 'development') {
      console.log(`${LOG_EMOJIS.ERROR} Error Tracked:`, error.message, context);
    }
  } catch (trackingError) {
    console.error('Error tracking failed:', trackingError);
  }
}

// Export analytics configuration for external use
export { analyticsConfig };

/**
 * Get analytics queue status (useful for debugging)
 */
export function getAnalyticsStatus() {
  return queueManager.getStatus();
}

/**
 * Flush analytics queue immediately (useful for testing)
 */
export async function flushAnalytics(): Promise<void> {
  await queueManager.flush();
}

/**
 * Clear analytics queue (useful for testing)
 */
export function clearAnalyticsQueue(): void {
  queueManager.clear();
}