/**
 * Analytics React Hooks
 * Custom hooks for tracking user interactions and events
 */

import { useEffect, useCallback, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { trackEvent, trackPageView, trackConversion, trackPerformance, type AnalyticsEventData, type ConversionData } from './index';
import { analyticsConfig, type AnalyticsEvent } from './config';

/**
 * Hook to track page views automatically
 */
export function usePageTracking() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const previousPath = useRef<string>('');

  useEffect(() => {
    const url = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '');
    
    // Avoid tracking the same page twice
    if (url !== previousPath.current) {
      previousPath.current = url;
      
      // Small delay to ensure page is loaded
      const timer = setTimeout(() => {
        trackPageView(url, document.title);
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [pathname, searchParams]);
}

/**
 * Hook to track events with automatic cleanup
 */
export function useAnalytics() {
  const track = useCallback((event: AnalyticsEvent | string, data?: AnalyticsEventData) => {
    trackEvent(event, data);
  }, []);

  const trackConversionEvent = useCallback((event: AnalyticsEvent | string, data: ConversionData) => {
    trackConversion(event, data);
  }, []);

  return {
    track,
    trackConversion: trackConversionEvent,
  };
}

/**
 * Hook to track user interactions on elements
 */
export function useInteractionTracking(
  event: AnalyticsEvent | string,
  data?: AnalyticsEventData,
  options: {
    trackOnMount?: boolean;
    trackOnUnmount?: boolean;
    debounceMs?: number;
  } = {}
) {
  const { trackOnMount = false, trackOnUnmount = false, debounceMs = 0 } = options;
  const timeoutRef = useRef<NodeJS.Timeout>();
  const { track } = useAnalytics();

  const trackInteraction = useCallback(() => {
    if (debounceMs > 0) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        track(event, data);
      }, debounceMs);
    } else {
      track(event, data);
    }
  }, [event, data, debounceMs, track]);

  useEffect(() => {
    if (trackOnMount) {
      trackInteraction();
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (trackOnUnmount) {
        track(event, { ...data, interaction_type: 'unmount' });
      }
    };
  }, [trackOnMount, trackOnUnmount, trackInteraction, track, event, data]);

  return trackInteraction;
}

/**
 * Hook to track form interactions
 */
export function useFormTracking(formName: string) {
  const { track } = useAnalytics();

  const trackFormStart = useCallback(() => {
    track('form_started', { form_name: formName });
  }, [formName, track]);

  const trackFormSubmit = useCallback((success: boolean, errors?: string[]) => {
    track('form_submitted', {
      form_name: formName,
      success,
      error_count: errors?.length || 0,
      errors: errors?.join(', '),
    });
  }, [formName, track]);

  const trackFieldInteraction = useCallback((fieldName: string, action: 'focus' | 'blur' | 'change') => {
    track('form_field_interaction', {
      form_name: formName,
      field_name: fieldName,
      action,
    });
  }, [formName, track]);

  return {
    trackFormStart,
    trackFormSubmit,
    trackFieldInteraction,
  };
}

/**
 * Generic debounced tracking hook
 */
function useDebounced<T extends any[]>(
  callback: (...args: T) => void,
  delay: number
): (...args: T) => void {
  const timeoutRef = useRef<NodeJS.Timeout>();
  
  const debouncedCallback = useCallback((...args: T) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  }, [callback, delay]);
  
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);
  
  return debouncedCallback;
}

/**
 * Hook to track search interactions
 */
export function useSearchTracking() {
  const { track } = useAnalytics();

  const trackSearchImmediate = useCallback((query: string, filters?: Record<string, any>, resultCount?: number) => {
    track(analyticsConfig.events.BOOK_SEARCH, {
      query,
      query_length: query.length,
      has_filters: !!filters && Object.keys(filters).length > 0,
      filter_count: filters ? Object.keys(filters).length : 0,
      result_count: resultCount,
      ...filters,
    });
  }, [track]);

  const trackSearch = useDebounced(trackSearchImmediate, 500);

  const trackSearchFilter = useCallback((filterType: string, filterValue: string | number) => {
    track(analyticsConfig.events.BOOK_FILTER, {
      filter_type: filterType,
      filter_value: filterValue.toString(),
    });
  }, [track]);

  return {
    trackSearch,
    trackSearchFilter,
  };
}

/**
 * Hook to track reading behavior
 */
export function useReadingTracking(bookId: string, bookTitle: string) {
  const { track } = useAnalytics();
  const startTimeRef = useRef<number>(Date.now());
  const lastProgressRef = useRef<number>(0);

  const trackBookOpen = useCallback(() => {
    startTimeRef.current = Date.now();
    track(analyticsConfig.events.BOOK_OPEN, {
      book_id: bookId,
      book_title: bookTitle,
    });
  }, [bookId, bookTitle, track]);

  const trackReadingProgress = useCallback((progress: number) => {
    const progressDiff = Math.abs(progress - lastProgressRef.current);
    
    // Only track significant progress changes (5% or more)
    if (progressDiff >= 5) {
      lastProgressRef.current = progress;
      track(analyticsConfig.events.READING_PROGRESS, {
        book_id: bookId,
        book_title: bookTitle,
        progress,
        reading_time: Date.now() - startTimeRef.current,
      });
    }
  }, [bookId, bookTitle, track]);

  const trackBookCompleted = useCallback(() => {
    const totalReadingTime = Date.now() - startTimeRef.current;
    track(analyticsConfig.events.BOOK_COMPLETED, {
      book_id: bookId,
      book_title: bookTitle,
      total_reading_time: totalReadingTime,
    });
  }, [bookId, bookTitle, track]);

  return {
    trackBookOpen,
    trackReadingProgress,
    trackBookCompleted,
  };
}

/**
 * Hook to track performance metrics
 */
export function usePerformanceTracking() {
  const trackLoadTime = useCallback((componentName: string, loadTime: number) => {
    trackPerformance(`${componentName}_load_time`, loadTime);
  }, []);

  const trackRenderTime = useCallback((componentName: string, renderTime: number) => {
    trackPerformance(`${componentName}_render_time`, renderTime);
  }, []);

  const trackApiCall = useCallback((endpoint: string, duration: number, success: boolean) => {
    trackPerformance(`api_${endpoint.replace(/\//g, '_')}_duration`, duration);
    trackEvent('api_call', {
      endpoint,
      duration,
      success,
    });
  }, []);

  return {
    trackLoadTime,
    trackRenderTime,
    trackApiCall,
  };
}