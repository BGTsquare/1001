/**
 * Analytics Configuration Tests
 */

import { describe, it, expect, beforeEach, afterAll, vi } from 'vitest';

// Mock environment variables
const originalEnv = process.env;

beforeEach(() => {
  vi.resetModules();
  process.env = { ...originalEnv };
});

afterAll(() => {
  process.env = originalEnv;
});

describe('Analytics Configuration', () => {
  it('should enable Vercel analytics in production with proper env var', async () => {
    process.env.NODE_ENV = 'production';
    process.env.NEXT_PUBLIC_VERCEL_ANALYTICS_ID = 'test-id';
    
    const { analyticsConfig: config } = await import('../config');
    expect(config.vercel.enabled).toBe(true);
    expect(config.vercel.debug).toBe(false);
    expect(config.vercel.analyticsId).toBe('test-id');
  });

  it('should disable Vercel analytics in production without env var', async () => {
    process.env.NODE_ENV = 'production';
    delete process.env.NEXT_PUBLIC_VERCEL_ANALYTICS_ID;
    
    const { analyticsConfig: config } = await import('../config');
    expect(config.vercel.enabled).toBe(false);
  });

  it('should enable debug mode in development', async () => {
    process.env.NODE_ENV = 'development';
    
    const { analyticsConfig: config } = await import('../config');
    expect(config.vercel.debug).toBe(true);
  });

  it('should configure Plausible when domain is provided', async () => {
    process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN = 'example.com';
    
    const { analyticsConfig: config } = await import('../config');
    expect(config.plausible.enabled).toBe(true);
    expect(config.plausible.domain).toBe('example.com');
  });

  it('should use custom API host for Plausible', async () => {
    process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN = 'example.com';
    process.env.NEXT_PUBLIC_PLAUSIBLE_API_HOST = 'https://custom.plausible.io';
    
    const { analyticsConfig: config } = await import('../config');
    expect(config.plausible.apiHost).toBe('https://custom.plausible.io');
  });

  it('should configure Sentry when DSN is provided', async () => {
    process.env.NEXT_PUBLIC_SENTRY_DSN = 'https://test@sentry.io/123';
    
    const { analyticsConfig: config } = await import('../config');
    expect(config.sentry.enabled).toBe(true);
    expect(config.sentry.dsn).toBe('https://test@sentry.io/123');
  });

  it('should use different sample rates for production vs development', async () => {
    // Test production
    process.env.NODE_ENV = 'production';
    vi.resetModules();
    const { analyticsConfig: prodConfig } = await import('../config');
    expect(prodConfig.sentry.tracesSampleRate).toBe(0.1);
    expect(prodConfig.sentry.profilesSampleRate).toBe(0.1);

    // Reset and test development
    vi.resetModules();
    process.env.NODE_ENV = 'development';
    const { analyticsConfig: devConfig } = await import('../config');
    expect(devConfig.sentry.tracesSampleRate).toBe(1.0);
    expect(devConfig.sentry.profilesSampleRate).toBe(1.0);
  });

  it('should parse general configuration from environment', async () => {
    process.env.ANALYTICS_BATCH_SIZE = '20';
    process.env.ANALYTICS_FLUSH_INTERVAL = '3000';
    process.env.ANALYTICS_MAX_RETRIES = '5';
    
    const { analyticsConfig: config } = await import('../config');
    expect(config.general.batchSize).toBe(20);
    expect(config.general.flushInterval).toBe(3000);
    expect(config.general.maxRetries).toBe(5);
  });

  it('should use default values when env vars are not provided', async () => {
    const { analyticsConfig: config } = await import('../config');
    expect(config.general.batchSize).toBe(10);
    expect(config.general.flushInterval).toBe(5000);
    expect(config.general.maxRetries).toBe(3);
  });

  it('should handle invalid numeric environment variables', async () => {
    process.env.ANALYTICS_BATCH_SIZE = 'invalid';
    process.env.ANALYTICS_FLUSH_INTERVAL = '-100';
    process.env.SENTRY_TRACES_SAMPLE_RATE = '2.0';
    
    const { analyticsConfig: config } = await import('../config');
    expect(config.general.batchSize).toBe(10); // default
    expect(config.general.flushInterval).toBe(5000); // default
    expect(config.sentry.tracesSampleRate).toBe(0.1); // default for production
  });
});