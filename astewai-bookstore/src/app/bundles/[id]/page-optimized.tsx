import { notFound } from 'next/navigation'
import { BundleDetail } from "@/components/bundles";
import { bundleService } from "@/lib/services/bundle-service";
import { HydrationBoundary, QueryClient, dehydrate } from "@tanstack/react-query";
import { generateBundleMetadata } from '@/lib/seo/metadata'
import { generateBundlePageStructuredData } from '@/lib/seo/page-structured-data'
import { MultipleStructuredData } from '@/components/seo/structured-data'
import { Suspense } from 'react'
import { BundleDetailSkeleton } from '@/components/bundles/bundle-detail-skeleton'

interface BundlePageProps {
  params: { id: string };
}

/**
 * Bundle detail page component with optimized data fetching
 * Uses React 18 features for better performance and UX
 */
export default async function BundleDetailPage({ params: { id } }: BundlePageProps) {
  // Early validation to avoid unnecessary processing
  if (!id || typeof id !== 'string' || id.trim().length === 0) {
    notFound()
  }

  // Fetch bundle data using service layer
  const result = await bundleService.getBundleById(id);
  
  if (!result.success || !result.data) {
    notFound()
  }

  const bundle = result.data;

  // Prefetch with the already fetched data
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      },
    },
  });
  
  queryClient.setQueryData(["bundle", id], bundle);

  // Generate structured data
  const structuredDataArray = generateBundlePageStructuredData(bundle);

  return (
    <>
      <MultipleStructuredData dataArray={structuredDataArray} />
      <div className="container mx-auto px-4 py-8">
        <Suspense fallback={<BundleDetailSkeleton />}>
          <HydrationBoundary state={dehydrate(queryClient)}>
            <BundleDetail bundle={bundle} />
          </HydrationBoundary>
        </Suspense>
      </div>
    </>
  );
}

/**
 * Generate metadata for bundle detail page with error handling
 * Creates SEO-optimized title, description, and Open Graph tags
 */
export async function generateMetadata({ params: { id } }: BundlePageProps) {
  try {
    // Early validation
    if (!id || typeof id !== 'string') {
      return {
        title: 'Bundle Not Found',
        description: 'The requested bundle could not be found.',
      }
    }

    const result = await bundleService.getBundleById(id);
    
    if (!result.success || !result.data) {
      return {
        title: 'Bundle Not Found',
        description: 'The requested bundle could not be found.',
      }
    }

    return generateBundleMetadata(result.data)
  } catch (error) {
    console.error('Error generating metadata for bundle:', id, error)
    return {
      title: 'Bundle Not Found',
      description: 'An error occurred while loading the bundle.',
    }
  }
}

// Enable static generation for better performance
export const dynamic = 'force-dynamic' // Remove this if you want static generation
export const revalidate = 300 // Revalidate every 5 minutes