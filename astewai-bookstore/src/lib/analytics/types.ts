/**
 * Analytics Type Definitions
 * Comprehensive type definitions for analytics events and data
 */

import type { analyticsConfig } from './config';

// Re-export config types
export type AnalyticsEvent = typeof analyticsConfig.events[keyof typeof analyticsConfig.events];

// Base event data interface
export interface BaseEventData {
  timestamp?: string;
  user_id?: string;
  session_id?: string;
  page_url?: string;
  user_agent?: string;
}

// Specific event data interfaces
export interface UserEventData extends BaseEventData {
  user_role?: 'user' | 'admin';
  registration_method?: 'email' | 'oauth' | 'invite';
  display_name?: string;
  email?: string;
}

export interface BookEventData extends BaseEventData {
  book_id: string;
  book_title?: string;
  book_category?: string;
  book_price?: number;
  book_author?: string;
  book_isbn?: string;
}

export interface SearchEventData extends BaseEventData {
  query: string;
  query_length?: number;
  result_count?: number;
  search_time?: number;
  has_filters?: boolean;
  filter_count?: number;
  filters?: Record<string, any>;
}

export interface PurchaseEventData extends BaseEventData {
  item_id: string;
  item_type: 'book' | 'bundle';
  item_name?: string;
  price: number;
  currency: string;
  payment_method?: 'stripe' | 'manual';
  discount_amount?: number;
  tax_amount?: number;
}

export interface BundleEventData extends BaseEventData {
  bundle_id: string;
  bundle_name?: string;
  bundle_price?: number;
  book_count?: number;
  discount_percentage?: number;
}

export interface LibraryEventData extends BaseEventData {
  book_id: string;
  book_title?: string;
  reading_progress?: number;
  reading_time?: number;
  total_reading_time?: number;
  completion_percentage?: number;
}

export interface AdminEventData extends BaseEventData {
  admin_id: string;
  admin_role?: string;
  action_type?: string;
  target_id?: string;
  target_type?: 'book' | 'bundle' | 'user' | 'purchase';
}

export interface FormEventData extends BaseEventData {
  form_name: string;
  field_name?: string;
  action?: 'start' | 'submit' | 'focus' | 'blur' | 'change';
  success?: boolean;
  error_count?: number;
  errors?: string;
}

export interface PerformanceEventData extends BaseEventData {
  metric: string;
  value: number;
  unit?: string;
  component?: string;
  endpoint?: string;
  duration?: number;
}

export interface ErrorEventData extends BaseEventData {
  error_message: string;
  error_name: string;
  error_stack?: string;
  component?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
}

// Event data type mapping for type safety
export type EventDataMap = {
  // User events
  user_signup: UserEventData;
  user_login: UserEventData;
  user_logout: UserEventData;
  
  // Book events
  book_view: BookEventData;
  book_preview: BookEventData;
  book_open: LibraryEventData;
  book_completed: LibraryEventData;
  
  // Search events
  book_search: SearchEventData;
  book_filter: SearchEventData;
  
  // Purchase events
  purchase_initiated: PurchaseEventData;
  purchase_completed: PurchaseEventData;
  purchase_failed: PurchaseEventData;
  
  // Bundle events
  bundle_view: BundleEventData;
  bundle_purchase: PurchaseEventData;
  
  // Library events
  library_view: BaseEventData;
  reading_progress: LibraryEventData;
  
  // Admin events
  admin_login: AdminEventData;
  book_upload: AdminEventData;
  bundle_create: AdminEventData;
  purchase_approve: AdminEventData;
  
  // Form events
  form_started: FormEventData;
  form_submitted: FormEventData;
  form_field_interaction: FormEventData;
  
  // Performance events
  performance_metric: PerformanceEventData;
  api_call: PerformanceEventData;
  
  // Error events
  error_occurred: ErrorEventData;
};

// Type-safe event tracking function signature
export type TrackEventFunction = <T extends keyof EventDataMap>(
  event: T,
  data?: EventDataMap[T]
) => void;

// Provider configuration types
export interface ProviderConfig {
  enabled: boolean;
  [key: string]: any;
}

export interface AnalyticsConfig {
  vercel: ProviderConfig & {
    debug: boolean;
    analyticsId?: string;
  };
  plausible: ProviderConfig & {
    domain: string;
    apiHost: string;
    trackLocalhost: boolean;
  };
  sentry: ProviderConfig & {
    dsn: string;
    environment: string;
    tracesSampleRate: number;
    profilesSampleRate: number;
  };
  general: {
    enableInDevelopment: boolean;
    batchSize: number;
    flushInterval: number;
    maxRetries: number;
  };
  events: Record<string, string>;
}

// Queue manager types
export interface QueuedEvent {
  event: string;
  data?: Record<string, any>;
  timestamp: number;
  retryCount: number;
}

export interface QueueStatus {
  queueSize: number;
  isProcessing: boolean;
}