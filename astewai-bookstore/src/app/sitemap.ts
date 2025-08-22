import { MetadataRoute } from 'next'
import {
  generateStaticSitemap,
  generateBooksSitemap,
  generateBundlesSitemap,
  generateBlogSitemap,
} from '@/lib/seo/sitemap'
import { createBuildClient } from '@/lib/supabase/build'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createBuildClient()

  // Get static pages
  const staticPages = generateStaticSitemap()

  // Get dynamic pages
  const [bookPages, bundlePages, blogPages] = await Promise.all([
    generateBooksSitemap(async () => {
      const { data: books, error } = await supabase
        .from('books')
        .select('id, updated_at')
        .limit(1000)
      if (error) {
        console.error('Error generating books sitemap:', error)
        return []
      }
      return books
    }),
    generateBundlesSitemap(async () => {
      const { data: bundles, error } = await supabase
        .from('bundles')
        .select('id, updated_at')
        .limit(1000)
      if (error) {
        console.error('Error generating bundles sitemap:', error)
        return []
      }
      return bundles
    }),
    generateBlogSitemap(async () => {
      // TODO: Implement blog posts fetching when blog service is available
      return []
    }),
  ])

  return [...staticPages, ...bookPages, ...bundlePages, ...blogPages]
}
