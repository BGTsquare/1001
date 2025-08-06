/**
 * Analytics Provider Component
 * Initializes and provides analytics context to the application
 */

'use client';

import { createContext, useContext, useEffect, ReactNode, useMemo } from 'react';
import { Analytics } from '@vercel/analytics/react';
import { useAuth } from '@/contexts/auth-context';
import { identifyUser } from '@/lib/analytics';
import { usePageTracking } from '@/lib/analytics/hooks';
import { analyticsConfig } from '@/lib/analytics/config';

interface AnalyticsContextType {
  isEnabled: boolean;
}

const AnalyticsContext = createContext<AnalyticsContextType>({
  isEnabled: false,
});

export function useAnalyticsContext() {
  return useContext(AnalyticsContext);
}

interface AnalyticsProviderProps {
  children: ReactNode;
}

export function AnalyticsProvider({ children }: AnalyticsProviderProps) {
  const { user, profile } = useAuth();
  
  // Track page views automatically
  usePageTracking();

  // Memoize user identification to prevent unnecessary calls
  const userIdentification = useMemo(() => {
    if (!user || !profile) return null;
    return {
      id: user.id,
      email: user.email,
      display_name: profile.display_name,
      role: profile.role,
      created_at: user.created_at,
    };
  }, [user?.id, user?.email, profile?.display_name, profile?.role, user?.created_at]);

  // Identify user when they log in (memoized)
  useEffect(() => {
    if (userIdentification) {
      identifyUser(userIdentification.id, userIdentification);
    }
  }, [userIdentification]);

  // Initialize performance monitoring
  useEffect(() => {
    if (typeof window !== 'undefined' && 'performance' in window) {
      // Track Core Web Vitals
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.entryType === 'navigation') {
            const navEntry = entry as PerformanceNavigationTiming;
            
            // Track page load metrics
            const loadTime = navEntry.loadEventEnd - navEntry.loadEventStart;
            const domContentLoaded = navEntry.domContentLoadedEventEnd - navEntry.domContentLoadedEventStart;
            const firstPaint = navEntry.responseEnd - navEntry.requestStart;
            
            // Send to analytics (debounced)
            setTimeout(() => {
              if (loadTime > 0) {
                import('@/lib/analytics').then(({ trackPerformance }) => {
                  trackPerformance('page_load_time', loadTime);
                  trackPerformance('dom_content_loaded', domContentLoaded);
                  trackPerformance('first_paint', firstPaint);
                });
              }
            }, 1000);
          }
        });
      });

      try {
        observer.observe({ entryTypes: ['navigation'] });
      } catch (error) {
        console.warn('Performance observer not supported:', error);
      }

      return () => {
        observer.disconnect();
      };
    }
  }, []);

  const contextValue: AnalyticsContextType = {
    isEnabled: analyticsConfig.vercel.enabled || analyticsConfig.plausible.enabled,
  };

  return (
    <AnalyticsContext.Provider value={contextValue}>
      {children}
      {/* Vercel Analytics */}
      {analyticsConfig.vercel.enabled && (
        <Analytics 
          debug={analyticsConfig.vercel.debug}
        />
      )}
      {/* Plausible Script */}
      {analyticsConfig.plausible.enabled && (
        <script
          defer
          data-domain={analyticsConfig.plausible.domain}
          data-api={`${analyticsConfig.plausible.apiHost}/api/event`}
          src={`${analyticsConfig.plausible.apiHost}/js/script.js`}
        />
      )}
    </AnalyticsContext.Provider>
  );
}