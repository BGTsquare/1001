import { notFound } from 'next/navigation'
import { BundleDetail } from "@/components/bundles";
import { bundleService } from "@/lib/services/bundle-service";
import { HydrationBoundary, QueryClient, dehydrate } from "@tanstack/react-query";
import { generateBundleMetadata } from '@/lib/seo/metadata'
import { generateBundlePageStructuredData } from '@/lib/seo/page-structured-data'
import { MultipleStructuredData } from '@/components/seo/structured-data'

interface BundlePageProps {
  params: { id: string };
}

/**
 * Bundle detail page component
 * Displays detailed information about a specific bundle including books, pricing, and purchase options
 */
export default async function BundleDetailPage({ params }: BundlePageProps) {
  // Fetch bundle data using service layer
  const result = await bundleService.getBundleById(params.id);
  
  if (!result.success || !result.data) {
    notFound()
  }

  const bundle = result.data;

  // Prefetch with the already fetched data
  const queryClient = new QueryClient();
  queryClient.setQueryData(["bundle", params.id], bundle);

  // Generate structured data
  const structuredDataArray = generateBundlePageStructuredData(bundle);

  return (
    <>
      <MultipleStructuredData dataArray={structuredDataArray} />
      <div className="container mx-auto px-4 py-8">
        <HydrationBoundary state={dehydrate(queryClient)}>
          <BundleDetail bundleId={params.id} />
        </HydrationBoundary>
      </div>
    </>
  );
}

/**
 * Generate metadata for bundle detail page
 * Creates SEO-optimized title, description, and Open Graph tags
 */
export async function generateMetadata({ params }: BundlePageProps) {
  const result = await bundleService.getBundleById(params.id);
  
  if (!result.success || !result.data) {
    return {
      title: 'Bundle Not Found',
    }
  }

  return generateBundleMetadata(result.data)
}