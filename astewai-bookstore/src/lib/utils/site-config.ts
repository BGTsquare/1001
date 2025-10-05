/**
 * Site configuration utilities
 */

export const SITE_CONFIG = {
  name: 'Astewai Digital Bookstore',
  defaultUrl: 'https://astewai-bookstore.vercel.app',
  currency: 'ETB',
} as const;

/**
 * Get the base URL for the site
 * Uses NEXT_PUBLIC_SITE_URL environment variable or falls back to default
 */
export function getBaseUrl(): string {
  // In browser environment, use window.location.origin as fallback
  if (typeof window !== 'undefined') {
    return process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
  }

  // In server environment, use environment variable or default
  return process.env.NEXT_PUBLIC_SITE_URL || SITE_CONFIG.defaultUrl;
}

/**
 * Get the authentication site URL
 * Uses SUPABASE_AUTH_SITE_URL or falls back to NEXT_PUBLIC_SITE_URL
 */
export function getAuthSiteUrl(): string {
  // In browser environment, use window.location.origin as fallback
  if (typeof window !== 'undefined') {
    return process.env.SUPABASE_AUTH_SITE_URL ||
           process.env.NEXT_PUBLIC_SITE_URL ||
           window.location.origin;
  }

  // In server environment, use environment variables or default
  return process.env.SUPABASE_AUTH_SITE_URL ||
         process.env.NEXT_PUBLIC_SITE_URL ||
         SITE_CONFIG.defaultUrl;
}

/**
 * Generate a full URL for a given path
 */
export function getFullUrl(path: string): string {
  const baseUrl = getBaseUrl();
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
}

/**
 * Generate authentication redirect URLs
 */
export function getAuthRedirectUrl(path: string): string {
  const authUrl = getAuthSiteUrl();
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${authUrl}${cleanPath}`;
}

/**
 * Check if we're in development environment
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development';
}

/**
 * Check if we're in production environment
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}