
import { BundleDetail } from "@/components/bundles/BundleDetail";
import { getBundleById } from "@/lib/repositories/bundleRepository";
import { HydrationBoundary, QueryClient, dehydrate } from "@tanstack/react-query";

export default async function BundleDetailPage({
  params,
}: {
  params: { bundleId: string };
}) {
  const queryClient = new QueryClient();

  await queryClient.prefetchQuery({
    queryKey: ["bundle", params.bundleId],
    queryFn: () => getBundleById(params.bundleId),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <BundleDetail bundleId={params.bundleId} />
    </HydrationBoundary>
  );
}
