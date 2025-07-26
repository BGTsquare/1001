
"use client";

import { useQuery } from "@tanstack/react-query";
import { getBundles } from "@/lib/repositories/bundleRepository";
import { BundleCard } from "./BundleCard";
import { Skeleton } from "@/components/ui/skeleton";

export function BundleGrid() {
  const { data: bundles, isLoading, isError } = useQuery({
    queryKey: ["bundles"],
    queryFn: getBundles,
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-64" />
        ))}
      </div>
    );
  }

  if (isError) {
    return <div>Error loading bundles.</div>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
      {bundles?.map((bundle) => (
        <BundleCard key={bundle.id} bundle={bundle} />
      ))}
    </div>
  );
}
