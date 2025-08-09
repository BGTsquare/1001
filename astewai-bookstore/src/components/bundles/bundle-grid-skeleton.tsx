import { Skeleton } from '@/components/ui/skeleton';

interface BundleGridSkeletonProps {
  itemCount?: number;
}

export function BundleGridSkeleton({ itemCount = 12 }: BundleGridSkeletonProps) {
  return (
    <div className="space-y-6">
      {/* Search skeleton */}
      <div className="max-w-2xl mx-auto">
        <Skeleton className="h-10 w-full" />
      </div>

      {/* Grid skeleton */}
      <div className="grid-responsive-bundles">
        {Array.from({ length: itemCount }).map((_, index) => (
          <div key={index} className="space-y-4">
            <Skeleton className="aspect-[4/3] w-full rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-3 w-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}