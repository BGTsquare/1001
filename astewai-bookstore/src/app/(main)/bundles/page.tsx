
import { BundleGrid } from "@/components/bundles/BundleGrid";
import { getBundles } from "@/lib/repositories/bundleRepository";
import { HydrationBoundary, QueryClient, dehydrate } from "@tanstack/react-query";

export default async function BundlesPage() {
  const queryClient = new QueryClient();

  await queryClient.prefetchQuery({
    queryKey: ["bundles"],
    queryFn: getBundles,
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-8">Book Bundles</h1>
        <BundleGrid />
      </div>
    </HydrationBoundary>
  );
}
