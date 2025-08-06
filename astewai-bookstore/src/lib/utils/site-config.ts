/**
 * Site configuration utilities
 */

export const SITE_CONFIG = {
  name: 'Astewai Digital Bookstore',
  defaultUrl: 'https://astewai-bookstore.com',
  currency: 'USD',
} as const;

/**
 * Get the base URL for the site
 * Uses NEXT_PUBLIC_SITE_URL environment variable or falls back to default
 */
export function getBaseUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL || SITE_CONFIG.defaultUrl;
}

/**
 * Generate a full URL for a given path
 */
export function getFullUrl(path: string): string {
  const baseUrl = getBaseUrl();
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
}