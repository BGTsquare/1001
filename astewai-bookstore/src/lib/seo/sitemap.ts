import { MetadataRoute } from 'next';

export interface SitemapEntry {
  url: string;
  lastModified?: string | Date;
  changeFrequency?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
}

export function generateSitemapEntry(
  path: string,
  options: {
    lastModified?: string | Date;
    changeFrequency?: SitemapEntry['changeFrequency'];
    priority?: number;
  } = {}
): SitemapEntry {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://astewai-bookstore.com';
  
  return {
    url: `${baseUrl}${path}`,
    lastModified: options.lastModified || new Date(),
    changeFrequency: options.changeFrequency || 'weekly',
    priority: options.priority || 0.5,
  };
}

export function generateStaticSitemap(): SitemapEntry[] {
  return [
    generateSitemapEntry('/', {
      changeFrequency: 'daily',
      priority: 1.0,
    }),
    generateSitemapEntry('/books', {
      changeFrequency: 'daily',
      priority: 0.9,
    }),
    generateSitemapEntry('/bundles', {
      changeFrequency: 'daily',
      priority: 0.9,
    }),
    generateSitemapEntry('/blog', {
      changeFrequency: 'daily',
      priority: 0.8,
    }),
    generateSitemapEntry('/contact', {
      changeFrequency: 'monthly',
      priority: 0.6,
    }),
    generateSitemapEntry('/auth/login', {
      changeFrequency: 'monthly',
      priority: 0.4,
    }),
    generateSitemapEntry('/auth/register', {
      changeFrequency: 'monthly',
      priority: 0.4,
    }),
  ];
}

export async function generateBooksSitemap(
  getBooks: () => Promise<Array<{ id: string; updated_at?: string }>>
): Promise<SitemapEntry[]> {
  try {
    const books = await getBooks();
    return books.map(book =>
      generateSitemapEntry(`/books/${book.id}`, {
        lastModified: book.updated_at || new Date(),
        changeFrequency: 'weekly',
        priority: 0.8,
      })
    );
  } catch (error) {
    console.error('Error generating books sitemap:', error);
    return [];
  }
}

export async function generateBundlesSitemap(
  getBundles: () => Promise<Array<{ id: string; updated_at?: string }>>
): Promise<SitemapEntry[]> {
  try {
    const bundles = await getBundles();
    return bundles.map(bundle =>
      generateSitemapEntry(`/bundles/${bundle.id}`, {
        lastModified: bundle.updated_at || new Date(),
        changeFrequency: 'weekly',
        priority: 0.8,
      })
    );
  } catch (error) {
    console.error('Error generating bundles sitemap:', error);
    return [];
  }
}

export async function generateBlogSitemap(
  getBlogPosts: () => Promise<Array<{ id: string; updated_at?: string }>>
): Promise<SitemapEntry[]> {
  try {
    const posts = await getBlogPosts();
    return posts.map(post =>
      generateSitemapEntry(`/blog/${post.id}`, {
        lastModified: post.updated_at || new Date(),
        changeFrequency: 'monthly',
        priority: 0.7,
      })
    );
  } catch (error) {
    console.error('Error generating blog sitemap:', error);
    return [];
  }
}