/**
 * Analytics Configuration
 * Centralized configuration for all analytics services
 */

// Configuration validation helpers
const parsePositiveInt = (value: string | undefined, defaultValue: number): number => {
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) || parsed <= 0 ? defaultValue : parsed;
};

const parseFloat = (value: string | undefined, defaultValue: number): number => {
  if (!value) return defaultValue;
  const parsed = parseFloat(value);
  return isNaN(parsed) || parsed < 0 || parsed > 1 ? defaultValue : parsed;
};

// Environment-based configuration factory
const createAnalyticsConfig = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  const isDevelopment = process.env.NODE_ENV === 'development';

  return {
    // Vercel Analytics
    vercel: {
      enabled: isProduction && !!process.env.NEXT_PUBLIC_VERCEL_ANALYTICS_ID,
      debug: isDevelopment,
      analyticsId: process.env.NEXT_PUBLIC_VERCEL_ANALYTICS_ID,
    },

    // Plausible Analytics (privacy-friendly alternative)
    plausible: {
      enabled: !!process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN,
      domain: process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN || '',
      apiHost: process.env.NEXT_PUBLIC_PLAUSIBLE_API_HOST || 'https://plausible.io',
      trackLocalhost: isDevelopment,
    },

    // Sentry Error Tracking
    sentry: {
      enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || '',
      environment: process.env.NODE_ENV || 'development',
      tracesSampleRate: parseFloat(
        process.env.SENTRY_TRACES_SAMPLE_RATE,
        isProduction ? 0.1 : 1.0
      ),
      profilesSampleRate: parseFloat(
        process.env.SENTRY_PROFILES_SAMPLE_RATE,
        isProduction ? 0.1 : 1.0
      ),
    },

    // General settings
    general: {
      enableInDevelopment: isDevelopment && process.env.ANALYTICS_DEV_MODE === 'true',
      batchSize: parsePositiveInt(process.env.ANALYTICS_BATCH_SIZE, 10),
      flushInterval: parsePositiveInt(process.env.ANALYTICS_FLUSH_INTERVAL, 5000),
      maxRetries: parsePositiveInt(process.env.ANALYTICS_MAX_RETRIES, 3),
    },
  } as const;
};

// Custom Analytics Events
const analyticsEvents = {
  // User Events
  USER_SIGNUP: 'user_signup',
  USER_LOGIN: 'user_login',
  USER_LOGOUT: 'user_logout',
  
  // Book Events
  BOOK_VIEW: 'book_view',
  BOOK_PREVIEW: 'book_preview',
  BOOK_SEARCH: 'book_search',
  BOOK_FILTER: 'book_filter',
  
  // Purchase Events
  PURCHASE_INITIATED: 'purchase_initiated',
  PURCHASE_COMPLETED: 'purchase_completed',
  PURCHASE_FAILED: 'purchase_failed',
  
  // Bundle Events
  BUNDLE_VIEW: 'bundle_view',
  BUNDLE_PURCHASE: 'bundle_purchase',
  
  // Library Events
  LIBRARY_VIEW: 'library_view',
  BOOK_OPEN: 'book_open',
  READING_PROGRESS: 'reading_progress',
  BOOK_COMPLETED: 'book_completed',
  
  // Admin Events
  ADMIN_LOGIN: 'admin_login',
  BOOK_UPLOAD: 'book_upload',
  BUNDLE_CREATE: 'bundle_create',
  PURCHASE_APPROVE: 'purchase_approve',
} as const;

export const analyticsConfig = {
  ...createAnalyticsConfig(),
  events: analyticsEvents,
};

export type AnalyticsEvent = typeof analyticsConfig.events[keyof typeof analyticsConfig.events];

// Type-safe event data interfaces
export interface BaseEventData {
  timestamp?: string;
  user_id?: string;
  session_id?: string;
}

export interface UserEventData extends BaseEventData {
  user_role?: string;
  registration_method?: string;
}

export interface BookEventData extends BaseEventData {
  book_id: string;
  book_title?: string;
  book_category?: string;
  book_price?: number;
}

export interface SearchEventData extends BaseEventData {
  query: string;
  result_count?: number;
  search_time?: number;
  filters?: Record<string, any>;
}

export interface PurchaseEventData extends BaseEventData {
  item_id: string;
  item_type: 'book' | 'bundle';
  price: number;
  currency: string;
  payment_method?: string;
}

// Event data type mapping
export type EventDataMap = {
  [K in AnalyticsEvent]: K extends 'user_signup' | 'user_login' | 'user_logout' 
    ? UserEventData
    : K extends 'book_view' | 'book_preview' | 'book_open' | 'book_completed'
    ? BookEventData
    : K extends 'book_search' | 'book_filter'
    ? SearchEventData
    : K extends 'purchase_initiated' | 'purchase_completed' | 'purchase_failed'
    ? PurchaseEventData
    : BaseEventData;
};