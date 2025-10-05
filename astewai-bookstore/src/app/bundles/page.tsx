import { Suspense } from 'react';
import { BundleGrid } from "@/components/bundles";
import { getBundles, getBundleStats } from "@/lib/repositories/bundleRepository";
import { generateMetadata } from '@/lib/seo/metadata';
import { generateBreadcrumbStructuredData } from '@/lib/seo/structured-data';
import { StructuredData } from '@/components/seo/structured-data';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { BundleStatsCards } from '@/components/bundles/bundle-stats-cards';
import { BundleCategoryFilter } from '@/components/bundles/bundle-category-filter';
import { BundleGridSkeleton } from '@/components/bundles/bundle-grid-skeleton';

// Force dynamic rendering for this page to avoid fetch errors during build
export const dynamic = 'force-dynamic';

export const metadata = generateMetadata({
  title: 'Book Bundles - Save More on Digital Books',
  description: 'Discover our curated book bundles and save money on digital books. Get multiple related books at discounted prices across all genres.',
  url: '/bundles',
  type: 'website',
  tags: ['book bundles', 'digital books', 'ebook collections', 'discounted books', 'book deals'],
});

export default async function BundlesPage() {
  // Fetch data directly without QueryClient for server-side rendering
  const [bundles, stats] = await Promise.all([
    getBundles({ limit: 12 }).catch(() => []),
    getBundleStats().catch(() => ({ total: 0, featured: 0, popular: 0, recent: 0 }))
  ]);

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://astewai-bookstore.com';

  const breadcrumbStructuredData = generateBreadcrumbStructuredData([
    { name: 'Home', url: baseUrl },
    { name: 'Bundles', url: `${baseUrl}/bundles` },
  ]);

  return (
    <>
      <StructuredData data={breadcrumbStructuredData} id="bundles-breadcrumb" />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Book Bundles</h1>
          <p className="text-muted-foreground">
            Save more with our carefully curated book collections
          </p>
        </div>

        {/* Bundle Statistics */}
        <ErrorBoundary>
          <BundleStatsCards stats={stats} />
        </ErrorBoundary>

        {/* Bundle Categories Filter */}
        <ErrorBoundary>
          <BundleCategoryFilter />
        </ErrorBoundary>

        {/* Bundles Grid */}
        <ErrorBoundary>
          <Suspense fallback={<BundleGridSkeleton />}>
            <BundleGrid initialBundles={bundles} />
          </Suspense>
        </ErrorBoundary>
      </div>
    </>
  );
}