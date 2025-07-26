
"use client";

import { useQuery } from "@tanstack/react-query";
import { getBundleById } from "@/lib/repositories/bundleRepository";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Book } from "@/types";
import { purchaseBundle } from "@/lib/actions/bundleActions";
import { useTransition } from "react";
import { toast } from "sonner";

interface BundleDetailProps {
  bundleId: string;
}

export function BundleDetail({ bundleId }: BundleDetailProps) {
  const [isPending, startTransition] = useTransition();

  const { data: bundle, isLoading, isError } = useQuery({
    queryKey: ["bundle", bundleId],
    queryFn: () => getBundleById(bundleId),
  });

  const handlePurchase = () => {
    startTransition(async () => {
      const result = await purchaseBundle(bundleId);
      if (result.success) {
        toast.success("Bundle purchased successfully!");
        // Redirect to library or checkout
      } else {
        toast.error(result.error);
      }
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <Skeleton className="h-12 w-1/2 mb-4" />
        <Skeleton className="h-6 w-3/4 mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <Skeleton className="h-96" />
          </div>
          <div>
            <Skeleton className="h-12 w-1/4 mb-4" />
            <Skeleton className="h-24" />
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return <div>Error loading bundle details.</div>;
  }

  const totalValue = bundle.books.reduce((acc: number, book: Book) => acc + book.price, 0);
  const savings = totalValue - bundle.price;

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-4xl font-bold mb-2">{bundle.title}</h1>
      <p className="text-lg text-muted-foreground mb-8">{bundle.description}</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-2xl font-bold mb-4">Books in this bundle</h2>
          <div className="space-y-4">
            {bundle.books.map((book: Book) => (
              <div key={book.id} className="flex items-center space-x-4">
                <img src={book.cover_image_url} alt={book.title} className="w-16 h-24 object-cover rounded-md" />
                <div>
                  <h3 className="font-semibold">{book.title}</h3>
                  <p className="text-sm text-muted-foreground">{book.author}</p>
                  <p className="text-sm font-semibold">${book.price}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <div className="bg-muted p-6 rounded-lg">
            <h2 className="text-2xl font-bold mb-4">Purchase Bundle</h2>
            <div className="text-4xl font-bold mb-2">${bundle.price}</div>
            <div className="text-muted-foreground">
              <span className="line-through">${totalValue.toFixed(2)}</span>
              <span className="font-semibold text-green-600 ml-2">Save ${savings.toFixed(2)}!</span>
            </div>
            <Button onClick={handlePurchase} disabled={isPending} className="w-full mt-6">
              {isPending ? "Processing..." : "Purchase Bundle"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
