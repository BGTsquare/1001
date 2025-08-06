import type { Metadata } from 'next';
import { APP_NAME, APP_DESCRIPTION } from '@/utils/constants';

// Cache the site URL to avoid repeated environment variable access
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

// Cache for frequently generated metadata to improve performance
const metadataCache = new Map<string, Metadata>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

interface CacheEntry {
  metadata: Metadata;
  timestamp: number;
}

/**
 * Generates a cache key from SEO config
 */
function generateCacheKey(config: SEOConfig): string {
  return JSON.stringify({
    title: config.title,
    description: config.description,
    url: config.url,
    type: config.type,
    image: config.image,
  });
}

/**
 * Gets cached metadata if available and not expired
 */
function getCachedMetadata(cacheKey: string): Metadata | null {
  const entry = metadataCache.get(cacheKey) as CacheEntry | undefined;
  if (!entry) return null;
  
  const isExpired = Date.now() - entry.timestamp > CACHE_TTL;
  if (isExpired) {
    metadataCache.delete(cacheKey);
    return null;
  }
  
  return entry.metadata;
}

/**
 * Caches metadata with timestamp
 */
function setCachedMetadata(cacheKey: string, metadata: Metadata): void {
  metadataCache.set(cacheKey, {
    metadata,
    timestamp: Date.now(),
  });
}

export interface SEOConfig {
  title: string;
  description: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'book' | 'product';
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  tags?: string[];
  price?: {
    amount: number;
    currency: string;
  };
  // Additional SEO fields
  isbn?: string; // For books
  category?: string;
  rating?: {
    value: number;
    count: number;
  };
}

/**
 * Type guard to check if a string is a valid URL
 */
function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Type guard to check if a string is a valid ISO date
 */
function isValidISODate(date: string): boolean {
  const isoDateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
  return isoDateRegex.test(date) && !isNaN(Date.parse(date));
}

/**
 * Validates SEO configuration and throws descriptive errors for missing required fields
 */
function validateSEOConfig(config: SEOConfig): void {
  // Required field validation
  if (!config.title?.trim()) {
    throw new Error('SEO config must include a non-empty title');
  }
  if (!config.description?.trim()) {
    throw new Error('SEO config must include a non-empty description');
  }

  // Length validation with warnings
  if (config.title.length > 60) {
    console.warn(`SEO title is ${config.title.length} characters, consider keeping it under 60 for optimal display`);
  }
  if (config.description.length > 160) {
    console.warn(`SEO description is ${config.description.length} characters, consider keeping it under 160 for optimal display`);
  }

  // URL validation
  if (config.image && !isValidUrl(config.image)) {
    throw new Error(`Invalid image URL: ${config.image}`);
  }
  if (config.url && !config.url.startsWith('/')) {
    throw new Error(`URL must be a relative path starting with '/': ${config.url}`);
  }

  // Date validation
  if (config.publishedTime && !isValidISODate(config.publishedTime)) {
    throw new Error(`Invalid publishedTime format, must be ISO 8601: ${config.publishedTime}`);
  }
  if (config.modifiedTime && !isValidISODate(config.modifiedTime)) {
    throw new Error(`Invalid modifiedTime format, must be ISO 8601: ${config.modifiedTime}`);
  }

  // Price validation
  if (config.price) {
    if (config.price.amount < 0) {
      throw new Error('Price amount cannot be negative');
    }
    if (!config.price.currency || config.price.currency.length !== 3) {
      throw new Error('Price currency must be a valid 3-letter currency code');
    }
  }

  // Rating validation
  if (config.rating) {
    if (config.rating.value < 0 || config.rating.value > 5) {
      throw new Error('Rating value must be between 0 and 5');
    }
    if (config.rating.count < 0) {
      throw new Error('Rating count cannot be negative');
    }
  }
}

/**
 * Creates Open Graph metadata object
 */
function createOpenGraphMetadata(config: SEOConfig, fullTitle: string, canonicalUrl?: string) {
  const { description, image, title, type, publishedTime, modifiedTime } = config;
  
  return {
    title: fullTitle,
    description,
    siteName: APP_NAME,
    type,
    ...(canonicalUrl && { url: canonicalUrl }),
    ...(image && { 
      images: [{ 
        url: image, 
        alt: title,
        width: 1200,
        height: 630,
      }] 
    }),
    ...(publishedTime && { publishedTime }),
    ...(modifiedTime && { modifiedTime }),
  };
}

/**
 * Creates Twitter metadata object
 */
function createTwitterMetadata(config: SEOConfig, fullTitle: string) {
  const { description, image, author } = config;
  
  return {
    card: image ? 'summary_large_image' : 'summary',
    title: fullTitle,
    description,
    ...(image && { images: [image] }),
    ...(author && { creator: `@${author}` }),
  };
}

/**
 * Creates structured data for products and books
 */
function createStructuredData(config: SEOConfig): Record<string, string> | undefined {
  const { type, title, description, image, author, price } = config;
  
  if (type !== 'book' && type !== 'product') {
    return undefined;
  }

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': type === 'book' ? 'Book' : 'Product',
    name: title,
    description,
    ...(image && { image }),
    ...(author && { author: { '@type': 'Person', name: author } }),
    ...(price && {
      offers: {
        '@type': 'Offer',
        price: price.amount,
        priceCurrency: price.currency,
        availability: 'https://schema.org/InStock',
      },
    }),
  };

  return { 'script:ld+json': JSON.stringify(structuredData) };
}

/**
 * Generates comprehensive metadata for SEO optimization with caching
 * @param config - SEO configuration object
 * @param useCache - Whether to use caching (default: true)
 * @returns Next.js Metadata object with OpenGraph, Twitter, and structured data
 */
export function generateMetadata(config: SEOConfig, useCache: boolean = true): Metadata {
  // Validate input configuration
  validateSEOConfig(config);

  // Check cache first if enabled
  if (useCache) {
    const cacheKey = generateCacheKey(config);
    const cachedMetadata = getCachedMetadata(cacheKey);
    if (cachedMetadata) {
      return cachedMetadata;
    }
  }

  const { title, description, url, tags } = config;
  const fullTitle = title.includes(APP_NAME) ? title : `${title} | ${APP_NAME}`;
  const canonicalUrl = url ? `${SITE_URL}${url}` : undefined;

  // Build metadata object with clean separation of concerns
  const metadata: Metadata = {
    title: fullTitle,
    description,
    ...(canonicalUrl && { alternates: { canonical: canonicalUrl } }),
    openGraph: createOpenGraphMetadata(config, fullTitle, canonicalUrl),
    twitter: createTwitterMetadata(config, fullTitle),
    ...(tags && { keywords: tags }),
  };

  // Add structured data if applicable
  const structuredData = createStructuredData(config);
  if (structuredData) {
    metadata.other = {
      ...metadata.other,
      ...structuredData,
    };
  }

  // Cache the result if caching is enabled
  if (useCache) {
    const cacheKey = generateCacheKey(config);
    setCachedMetadata(cacheKey, metadata);
  }

  return metadata;
}

export function generateDefaultMetadata(): Metadata {
  return generateMetadata({
    title: APP_NAME,
    description: APP_DESCRIPTION,
    type: 'website',
  });
}

export function generateBookMetadata(book: {
  id: string;
  title: string;
  author: string;
  description?: string;
  cover_image_url?: string;
  price?: number;
  category?: string;
}): Metadata {
  return generateMetadata({
    title: `${book.title} by ${book.author}`,
    description: book.description || `Read ${book.title} by ${book.author} on ${APP_NAME}`,
    image: book.cover_image_url,
    url: `/books/${book.id}`,
    type: 'book',
    author: book.author,
    tags: book.category ? [book.category, 'digital book', 'ebook'] : ['digital book', 'ebook'],
    ...(book.price && {
      price: {
        amount: book.price,
        currency: 'USD',
      },
    }),
  });
}

export function generateBundleMetadata(bundle: {
  id: string;
  title: string;
  description?: string;
  image_url?: string;
  price?: number;
  original_price?: number;
  books?: Array<{ title: string; author: string }>;
}): Metadata {
  const bookTitles = bundle.books?.map(book => book.title).join(', ') || '';
  const description = bundle.description || 
    `Get ${bundle.books?.length || 'multiple'} books in one bundle: ${bookTitles}`;

  return generateMetadata({
    title: bundle.title,
    description,
    image: bundle.image_url,
    url: `/bundles/${bundle.id}`,
    type: 'product',
    tags: ['book bundle', 'digital books', 'ebooks', 'discount'],
    ...(bundle.price && {
      price: {
        amount: bundle.price,
        currency: 'USD',
      },
    }),
  });
}

export function generateBlogPostMetadata(post: {
  id: string;
  title: string;
  excerpt?: string;
  content?: string;
  featured_image_url?: string;
  published_at?: string;
  updated_at?: string;
  author?: string;
  tags?: string[];
}): Metadata {
  const description = post.excerpt || 
    (post.content ? post.content.substring(0, 160) + '...' : `Read ${post.title} on ${APP_NAME} blog`);

  return generateMetadata({
    title: post.title,
    description,
    image: post.featured_image_url,
    url: `/blog/${post.id}`,
    type: 'article',
    publishedTime: post.published_at,
    modifiedTime: post.updated_at,
    author: post.author,
    tags: post.tags || ['blog', 'books', 'reading'],
  });
}