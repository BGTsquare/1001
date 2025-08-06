/**
 * Base Analytics Provider Interface
 */

export interface AnalyticsEventData {
  [key: string]: string | number | boolean | null | undefined;
}

export interface ConversionData extends AnalyticsEventData {
  value?: number;
  currency?: string;
  item_id?: string;
  item_name?: string;
  category?: string;
}

export abstract class BaseAnalyticsProvider {
  protected enabled: boolean;
  protected config: any;

  constructor(config: any) {
    this.config = config;
    this.enabled = config.enabled;
  }

  abstract trackEvent(event: string, data?: AnalyticsEventData): Promise<void>;
  abstract trackPageView(url: string, title?: string): Promise<void>;
  abstract trackConversion(event: string, data: ConversionData): Promise<void>;
  abstract identifyUser(userId: string, traits?: Record<string, any>): Promise<void>;

  isEnabled(): boolean {
    return this.enabled;
  }
}