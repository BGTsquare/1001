import { generateProductStructuredData, generateBreadcrumbStructuredData, generateBookStructuredData } from './structured-data';
import { getBaseUrl, SITE_CONFIG } from '@/lib/utils/site-config';
import type { Bundle, Book } from '@/types';

/**
 * Generate structured data for bundle pages
 */
export function generateBundlePageStructuredData(bundle: Bundle) {
  const baseUrl = getBaseUrl();

  const productStructuredData = generateProductStructuredData({
    name: bundle.title,
    description: bundle.description,
    price: bundle.price,
    currency: SITE_CONFIG.currency,
    image: bundle.image_url,
    url: `${baseUrl}/bundles/${bundle.id}`,
    brand: SITE_CONFIG.name,
    sku: `bundle-${bundle.id}`,
  });

  const breadcrumbStructuredData = generateBreadcrumbStructuredData([
    { name: 'Home', url: baseUrl },
    { name: 'Bundles', url: `${baseUrl}/bundles` },
    { name: bundle.title, url: `${baseUrl}/bundles/${bundle.id}` },
  ]);

  return [
    { data: productStructuredData, id: 'bundle-structured-data' },
    { data: breadcrumbStructuredData, id: 'breadcrumb-structured-data' },
  ];
}

/**
 * Generate structured data for book pages
 */
export function generateBookPageStructuredData(book: Book) {
  const baseUrl = getBaseUrl();

  const bookStructuredData = generateBookStructuredData({
    title: book.title,
    author: book.author,
    description: book.description,
    genre: book.category,
    price: book.price,
    currency: SITE_CONFIG.currency,
    image: book.cover_image_url,
    url: `${baseUrl}/books/${book.id}`,
  });

  const breadcrumbStructuredData = generateBreadcrumbStructuredData([
    { name: 'Home', url: baseUrl },
    { name: 'Books', url: `${baseUrl}/books` },
    { name: book.title, url: `${baseUrl}/books/${book.id}` },
  ]);

  return [
    { data: bookStructuredData, id: 'book-structured-data' },
    { data: breadcrumbStructuredData, id: 'breadcrumb-structured-data' },
  ];
}