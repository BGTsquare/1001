// Re-export all SEO utilities for easy importing
export * from './metadata';
export * from './structured-data';
export * from './sitemap';

// SEO constants
export const SEO_CONSTANTS = {
  SITE_NAME: 'Astewai Digital Bookstore',
  SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || 'https://astewai-bookstore.com',
  TWITTER_HANDLE: '@astewai_books',
  DEFAULT_IMAGE: '/images/og-default.jpg',
  FAVICON: '/favicon.ico',
  APPLE_TOUCH_ICON: '/apple-touch-icon.png',
} as const;

// Common meta tags for all pages
export const COMMON_META_TAGS = [
  'digital bookstore',
  'ebooks',
  'online books',
  'reading',
  'digital library',
  'astewai',
] as const;

// Page-specific meta tag collections
export const PAGE_META_TAGS = {
  HOME: [...COMMON_META_TAGS, 'book bundles', 'featured books', 'bestsellers'],
  BOOKS: [...COMMON_META_TAGS, 'book collection', 'fiction', 'non-fiction', 'genres'],
  BUNDLES: [...COMMON_META_TAGS, 'book bundles', 'discounted books', 'book deals', 'collections'],
  BLOG: [...COMMON_META_TAGS, 'blog', 'book reviews', 'reading tips', 'author interviews'],
  CONTACT: [...COMMON_META_TAGS, 'contact', 'support', 'help', 'customer service'],
} as const;