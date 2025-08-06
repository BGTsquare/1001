import { MetadataRoute } from 'next';
import { 
  generateStaticSitemap, 
  generateBooksSitemap, 
  generateBundlesSitemap, 
  generateBlogSitemap 
} from '@/lib/seo/sitemap';
import { bookService } from '@/lib/services/book-service';
import { getBundles } from '@/lib/repositories/bundleRepository';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Get static pages
  const staticPages = generateStaticSitemap();

  // Get dynamic pages
  const [bookPages, bundlePages, blogPages] = await Promise.all([
    generateBooksSitemap(async () => {
      const result = await bookService.getBooks({ page: 1, limit: 1000 });
      return result.success ? result.data.books.map(book => ({
        id: book.id,
        updated_at: book.updated_at,
      })) : [];
    }),
    generateBundlesSitemap(async () => {
      const bundles = await getBundles();
      return bundles.map(bundle => ({
        id: bundle.id,
        updated_at: bundle.updated_at,
      }));
    }),
    generateBlogSitemap(async () => {
      // TODO: Implement blog posts fetching when blog service is available
      return [];
    }),
  ]);

  return [
    ...staticPages,
    ...bookPages,
    ...bundlePages,
    ...blogPages,
  ];
}