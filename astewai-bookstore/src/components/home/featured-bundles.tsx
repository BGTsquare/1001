'use client';

import { useQuery } from '@tanstack/react-query';
import { BundleCard } from '@/components/bundles';
import { getBundles } from '@/lib/repositories/bundleRepository';

export function FeaturedBundles() {
  const { data: bundles, isLoading, error } = useQuery({
    queryKey: ['bundles', 'featured'],
    queryFn: () => getBundles(),
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-muted rounded-lg h-48 mb-4"></div>
            <div className="bg-muted rounded h-4 mb-2"></div>
            <div className="bg-muted rounded h-3 w-2/3 mb-2"></div>
            <div className="bg-muted rounded h-6 w-1/3"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Failed to load featured bundles</p>
      </div>
    );
  }

  if (!bundles || bundles.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No featured bundles available</p>
      </div>
    );
  }

  // Show only first 3 bundles for featured section
  const featuredBundles = bundles.slice(0, 3);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {featuredBundles.map((bundle) => (
        <BundleCard key={bundle.id} bundle={bundle} />
      ))}
    </div>
  );
}