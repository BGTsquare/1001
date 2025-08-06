/**
 * Plausible Analytics Provider
 */

import Plausible from 'plausible-tracker';
import { BaseAnalyticsProvider, type AnalyticsEventData, type ConversionData } from './base-provider';

export class PlausibleAnalyticsProvider extends BaseAnalyticsProvider {
  private plausible: ReturnType<typeof Plausible> | null = null;

  constructor(config: any) {
    super(config);
    
    if (this.enabled) {
      this.plausible = Plausible({
        domain: config.domain,
        apiHost: config.apiHost,
        trackLocalhost: config.trackLocalhost,
      });
    }
  }

  async trackEvent(event: string, data?: AnalyticsEventData): Promise<void> {
    if (!this.enabled || !this.plausible) return;
    
    try {
      this.plausible.trackEvent(event, {
        props: data as Record<string, string | number>,
      });
    } catch (error) {
      throw new Error(`Plausible Analytics error: ${error}`);
    }
  }

  async trackPageView(url: string, title?: string): Promise<void> {
    if (!this.enabled || !this.plausible) return;
    
    try {
      this.plausible.trackPageview({
        url,
        ...(title && { title }),
      });
    } catch (error) {
      throw new Error(`Plausible page view error: ${error}`);
    }
  }

  async trackConversion(event: string, data: ConversionData): Promise<void> {
    if (!this.enabled || !this.plausible) return;
    
    try {
      // Track the main conversion event
      await this.trackEvent(event, data);
      
      // Track revenue separately if available
      if (data.value && data.currency) {
        this.plausible.trackEvent('Revenue', {
          props: {
            amount: data.value,
            currency: data.currency,
            item: data.item_name || data.item_id || 'unknown',
          },
        });
      }
    } catch (error) {
      throw new Error(`Plausible conversion error: ${error}`);
    }
  }

  async identifyUser(userId: string, traits?: Record<string, any>): Promise<void> {
    if (!this.enabled || !this.plausible) return;
    
    try {
      this.plausible.trackEvent('User Identified', {
        props: {
          user_id: userId,
          ...traits,
        },
      });
    } catch (error) {
      throw new Error(`Plausible user identification error: ${error}`);
    }
  }
}