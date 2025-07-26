
import Link from "next/link";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bundle } from "@/types";

interface BundleCardProps {
  bundle: Bundle;
}

export function BundleCard({ bundle }: BundleCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{bundle.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{bundle.description}</p>
        <p className="text-lg font-bold mt-4">${bundle.price}</p>
        <p className="text-sm text-muted-foreground">{bundle.books.length} books</p>
      </CardContent>
      <CardFooter>
        <Link href={`/bundles/${bundle.id}`} passHref>
          <Button>View Bundle</Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
