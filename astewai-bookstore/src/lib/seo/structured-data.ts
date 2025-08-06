export interface StructuredDataConfig {
  type: 'WebSite' | 'Book' | 'Product' | 'Article' | 'Organization' | 'BreadcrumbList';
  data: Record<string, any>;
}

export function generateStructuredData(config: StructuredDataConfig): string {
  const { type, data } = config;
  
  const baseStructure = {
    '@context': 'https://schema.org',
    '@type': type,
    ...data,
  };

  return JSON.stringify(baseStructure);
}

export function generateWebSiteStructuredData(siteUrl: string, siteName: string): string {
  return generateStructuredData({
    type: 'WebSite',
    data: {
      name: siteName,
      url: siteUrl,
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: `${siteUrl}/search?q={search_term_string}`,
        },
        'query-input': 'required name=search_term_string',
      },
    },
  });
}

export function generateBookStructuredData(book: {
  title: string;
  author: string;
  description?: string;
  isbn?: string;
  genre?: string;
  price?: number;
  currency?: string;
  image?: string;
  url?: string;
}): string {
  return generateStructuredData({
    type: 'Book',
    data: {
      name: book.title,
      author: {
        '@type': 'Person',
        name: book.author,
      },
      ...(book.description && { description: book.description }),
      ...(book.isbn && { isbn: book.isbn }),
      ...(book.genre && { genre: book.genre }),
      ...(book.image && { image: book.image }),
      ...(book.url && { url: book.url }),
      ...(book.price && {
        offers: {
          '@type': 'Offer',
          price: book.price,
          priceCurrency: book.currency || 'USD',
          availability: 'https://schema.org/InStock',
        },
      }),
    },
  });
}

export function generateProductStructuredData(product: {
  name: string;
  description?: string;
  price?: number;
  currency?: string;
  image?: string;
  url?: string;
  brand?: string;
  sku?: string;
}): string {
  return generateStructuredData({
    type: 'Product',
    data: {
      name: product.name,
      ...(product.description && { description: product.description }),
      ...(product.image && { image: product.image }),
      ...(product.url && { url: product.url }),
      ...(product.brand && { brand: { '@type': 'Brand', name: product.brand } }),
      ...(product.sku && { sku: product.sku }),
      ...(product.price && {
        offers: {
          '@type': 'Offer',
          price: product.price,
          priceCurrency: product.currency || 'USD',
          availability: 'https://schema.org/InStock',
        },
      }),
    },
  });
}

export function generateArticleStructuredData(article: {
  headline: string;
  description?: string;
  author?: string;
  datePublished?: string;
  dateModified?: string;
  image?: string;
  url?: string;
}): string {
  return generateStructuredData({
    type: 'Article',
    data: {
      headline: article.headline,
      ...(article.description && { description: article.description }),
      ...(article.author && {
        author: {
          '@type': 'Person',
          name: article.author,
        },
      }),
      ...(article.datePublished && { datePublished: article.datePublished }),
      ...(article.dateModified && { dateModified: article.dateModified }),
      ...(article.image && { image: article.image }),
      ...(article.url && { url: article.url }),
    },
  });
}

export function generateOrganizationStructuredData(org: {
  name: string;
  url: string;
  logo?: string;
  description?: string;
  contactPoint?: {
    telephone?: string;
    email?: string;
    contactType?: string;
  };
}): string {
  return generateStructuredData({
    type: 'Organization',
    data: {
      name: org.name,
      url: org.url,
      ...(org.logo && { logo: org.logo }),
      ...(org.description && { description: org.description }),
      ...(org.contactPoint && {
        contactPoint: {
          '@type': 'ContactPoint',
          ...org.contactPoint,
        },
      }),
    },
  });
}

export function generateBreadcrumbStructuredData(breadcrumbs: Array<{
  name: string;
  url: string;
}>): string {
  return generateStructuredData({
    type: 'BreadcrumbList',
    data: {
      itemListElement: breadcrumbs.map((crumb, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: crumb.name,
        item: crumb.url,
      })),
    },
  });
}