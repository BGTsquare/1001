import { Suspense } from 'react';
import { BundleGrid } from "@/components/bundles/BundleGrid";
import { getBundles } from "@/lib/repositories/bundleRepository";
import { HydrationBoundary, QueryClient, dehydrate } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package, Star, TrendingUp } from 'lucide-react';

export default async function BundlesPage() {
  const queryClient = new QueryClient();

  await queryClient.prefetchQuery({
    queryKey: ["bundles"],
    queryFn: getBundles,
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Book Bundles</h1>
          <p className="text-muted-foreground">
            Save more with our carefully curated book collections
          </p>
        </div>

        {/* Bundle Categories */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card>
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Featured Bundles</CardTitle>
              <Star className="h-4 w-4 ml-auto text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-muted-foreground">
                Handpicked collections
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Popular Bundles</CardTitle>
              <TrendingUp className="h-4 w-4 ml-auto text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">8</div>
              <p className="text-xs text-muted-foreground">
                Most purchased this month
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Bundles</CardTitle>
              <Package className="h-4 w-4 ml-auto text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">25</div>
              <p className="text-xs text-muted-foreground">
                Available collections
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Bundle Categories Filter */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Browse by Category</h2>
          <div className="flex flex-wrap gap-2">
            <Badge variant="default" className="cursor-pointer">All Bundles</Badge>
            <Badge variant="outline" className="cursor-pointer">Fiction</Badge>
            <Badge variant="outline" className="cursor-pointer">Non-Fiction</Badge>
            <Badge variant="outline" className="cursor-pointer">Science Fiction</Badge>
            <Badge variant="outline" className="cursor-pointer">Mystery</Badge>
            <Badge variant="outline" className="cursor-pointer">Romance</Badge>
            <Badge variant="outline" className="cursor-pointer">Business</Badge>
            <Badge variant="outline" className="cursor-pointer">Self-Help</Badge>
          </div>
        </div>

        {/* Bundles Grid */}
        <Suspense fallback={<div className="text-center py-8">Loading bundles...</div>}>
          <BundleGrid />
        </Suspense>
      </div>
    </HydrationBoundary>
  );
}