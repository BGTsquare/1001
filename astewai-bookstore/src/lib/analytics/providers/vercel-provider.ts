/**
 * Vercel Analytics Provider
 */

import { track as vercelTrack } from '@vercel/analytics';
import { BaseAnalyticsProvider, type AnalyticsEventData, type ConversionData } from './base-provider';

export class VercelAnalyticsProvider extends BaseAnalyticsProvider {
  async trackEvent(event: string, data?: AnalyticsEventData): Promise<void> {
    if (!this.enabled) return;
    
    try {
      vercelTrack(event, data);
    } catch (error) {
      throw new Error(`Vercel Analytics error: ${error}`);
    }
  }

  async trackPageView(url: string, title?: string): Promise<void> {
    // Vercel Analytics handles page views automatically
    // Custom page view tracking can be implemented here if needed
  }

  async trackConversion(event: string, data: ConversionData): Promise<void> {
    return this.trackEvent(event, data);
  }

  async identifyUser(userId: string, traits?: Record<string, any>): Promise<void> {
    // Vercel Analytics doesn't have explicit user identification
    // Could track as a custom event if needed
    return this.trackEvent('user_identified', { user_id: userId, ...traits });
  }
}