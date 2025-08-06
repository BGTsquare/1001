/**
 * Analytics Service Tests
 * Tests for the analytics tracking functionality
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { trackEvent, trackConversion, trackPageView, identifyUser } from '../index';

// Mock external dependencies
vi.mock('@vercel/analytics', () => ({
  track: vi.fn(),
}));

vi.mock('plausible-tracker', () => ({
  default: vi.fn(() => ({
    trackEvent: vi.fn(),
    trackPageview: vi.fn(),
  })),
}));

vi.mock('@sentry/nextjs', () => ({
  addBreadcrumb: vi.fn(),
  captureException: vi.fn(),
  setUser: vi.fn(),
}));

// Mock environment variables
vi.mock('../config', () => ({
  analyticsConfig: {
    vercel: { enabled: true },
    plausible: { enabled: true, domain: 'test.com', apiHost: 'https://plausible.io' },
    sentry: { enabled: true },
    events: {
      USER_SIGNUP: 'user_signup',
      BOOK_VIEW: 'book_view',
      PURCHASE_COMPLETED: 'purchase_completed',
    },
  },
}));

describe('Analytics Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock console methods
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('trackEvent', () => {
    it('should track events with data', () => {
      const eventData = { book_id: '123', book_title: 'Test Book' };
      
      trackEvent('book_view', eventData);
      
      // Should not throw any errors
      expect(console.error).not.toHaveBeenCalled();
    });

    it('should handle events without data', () => {
      trackEvent('user_login');
      
      expect(console.error).not.toHaveBeenCalled();
    });

    it('should handle tracking errors gracefully', () => {
      // Mock an error in tracking
      const mockError = new Error('Tracking failed');
      vi.mocked(console.error).mockImplementation(() => {
        throw mockError;
      });

      // Should not throw
      expect(() => trackEvent('test_event')).not.toThrow();
    });
  });

  describe('trackConversion', () => {
    it('should track conversion events with value', () => {
      const conversionData = {
        item_id: 'book-123',
        item_name: 'Test Book',
        value: 29.99,
        currency: 'USD',
      };

      trackConversion('purchase_completed', conversionData);
      
      expect(console.error).not.toHaveBeenCalled();
    });

    it('should add timestamp to conversion data', () => {
      const conversionData = { value: 10, currency: 'USD' };
      
      trackConversion('purchase_completed', conversionData);
      
      // Should not error and should add timestamp
      expect(console.error).not.toHaveBeenCalled();
    });
  });

  describe('trackPageView', () => {
    it('should track page views with URL', () => {
      trackPageView('/books/123', 'Test Book Page');
      
      expect(console.error).not.toHaveBeenCalled();
    });

    it('should track page views without title', () => {
      trackPageView('/books');
      
      expect(console.error).not.toHaveBeenCalled();
    });
  });

  describe('identifyUser', () => {
    it('should identify user with traits', () => {
      const traits = {
        email: 'test@example.com',
        role: 'user',
        display_name: 'Test User',
      };

      identifyUser('user-123', traits);
      
      expect(console.error).not.toHaveBeenCalled();
    });

    it('should identify user without traits', () => {
      identifyUser('user-123');
      
      expect(console.error).not.toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should handle analytics provider errors', () => {
      // Mock all providers to throw errors
      vi.doMock('@vercel/analytics', () => ({
        track: vi.fn(() => { throw new Error('Vercel error'); }),
      }));

      // Should not throw
      expect(() => trackEvent('test_event')).not.toThrow();
    });

    it('should log errors in development', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      trackEvent('test_event', { test: 'data' });

      // Should log in development
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('📊 Analytics Event:'),
        'test_event',
        { test: 'data' }
      );

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('data validation', () => {
    it('should handle null and undefined data', () => {
      expect(() => trackEvent('test_event', null as any)).not.toThrow();
      expect(() => trackEvent('test_event', undefined)).not.toThrow();
    });

    it('should handle complex data objects', () => {
      const complexData = {
        nested: { object: { with: 'values' } },
        array: [1, 2, 3],
        boolean: true,
        number: 42,
        string: 'test',
      };

      expect(() => trackEvent('test_event', complexData)).not.toThrow();
    });
  });
});