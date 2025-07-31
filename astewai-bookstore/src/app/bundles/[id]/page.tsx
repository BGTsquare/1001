import { BundleDetail } from "@/components/bundles/BundleDetail";
import { getBundleById } from "@/lib/repositories/bundleRepository";
import { HydrationBoundary, QueryClient, dehydrate } from "@tanstack/react-query";

export default async function BundleDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const queryClient = new QueryClient();

  await queryClient.prefetchQuery({
    queryKey: ["bundle", params.id],
    queryFn: () => getBundleById(params.id),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <BundleDetail bundleId={params.id} />
    </HydrationBoundary>
  );
}