/**
 * Sentry Analytics Provider
 */

import * as Sentry from '@sentry/nextjs';
import { BaseAnalyticsProvider, type AnalyticsEventData, type ConversionData } from './base-provider';

export class SentryAnalyticsProvider extends BaseAnalyticsProvider {
  async trackEvent(event: string, data?: AnalyticsEventData): Promise<void> {
    if (!this.enabled) return;
    
    try {
      Sentry.addBreadcrumb({
        category: 'analytics',
        message: `Event tracked: ${event}`,
        data,
        level: 'info',
      });
    } catch (error) {
      throw new Error(`Sentry breadcrumb error: ${error}`);
    }
  }

  async trackPageView(url: string, title?: string): Promise<void> {
    if (!this.enabled) return;
    
    try {
      Sentry.addBreadcrumb({
        category: 'navigation',
        message: `Page view: ${url}`,
        data: { title },
        level: 'info',
      });
    } catch (error) {
      throw new Error(`Sentry page view error: ${error}`);
    }
  }

  async trackConversion(event: string, data: ConversionData): Promise<void> {
    return this.trackEvent(event, data);
  }

  async identifyUser(userId: string, traits?: Record<string, any>): Promise<void> {
    if (!this.enabled) return;
    
    try {
      Sentry.setUser({
        id: userId,
        ...traits,
      });
    } catch (error) {
      throw new Error(`Sentry user identification error: ${error}`);
    }
  }

  trackError(error: Error, context?: Record<string, any>): void {
    if (!this.enabled) return;
    
    Sentry.captureException(error, {
      extra: context,
      tags: { tracked: true },
    });
  }
}