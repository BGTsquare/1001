import { Suspense } from 'react';
import { BundleGrid } from "@/components/bundles";
import { getBundles, getBundleStats } from "@/lib/repositories/bundleRepository";
import { HydrationBoundary, QueryClient, dehydrate } from "@tanstack/react-query";
import { generateMetadata } from '@/lib/seo/metadata';
import { generateBreadcrumbStructuredData } from '@/lib/seo/structured-data';
import { StructuredData } from '@/components/seo/structured-data';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { BundleStatsCards } from '@/components/bundles/bundle-stats-cards';
import { BundleCategoryFilter } from '@/components/bundles/bundle-category-filter';
import { BundleGridSkeleton } from '@/components/bundles/bundle-grid-skeleton';

export const metadata = generateMetadata({
  title: 'Book Bundles - Save More on Digital Books',
  description: 'Discover our curated book bundles and save money on digital books. Get multiple related books at discounted prices across all genres.',
  url: '/bundles',
  type: 'website',
  tags: ['book bundles', 'digital books', 'ebook collections', 'discounted books', 'book deals'],
});

export default async function BundlesPage() {
  const queryClient = new QueryClient();

  // Prefetch bundles and stats in parallel
  const [bundles, stats] = await Promise.all([
    queryClient.fetchQuery({
      queryKey: ["bundles"],
      queryFn: () => getBundles({ limit: 12 }),
    }),
    queryClient.fetchQuery({
      queryKey: ["bundle-stats"],
      queryFn: getBundleStats,
    })
  ]);

  // Prefetch the data for client-side usage
  await queryClient.prefetchQuery({
    queryKey: ["bundles"],
    queryFn: () => getBundles(),
  });

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://astewai-bookstore.com';

  const breadcrumbStructuredData = generateBreadcrumbStructuredData([
    { name: 'Home', url: baseUrl },
    { name: 'Bundles', url: `${baseUrl}/bundles` },
  ]);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
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
    </HydrationBoundary>
  );
}