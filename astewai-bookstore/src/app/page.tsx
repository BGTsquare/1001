import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ROUTES, APP_NAME } from '@/utils/constants';

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <section className="text-center py-16">
        <h1 className="text-4xl md:text-6xl font-bold mb-6">
          Welcome to {APP_NAME}
        </h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Discover, purchase, and read digital books from your favorite authors.
          Build your personal library and track your reading progress.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href={ROUTES.BOOKS}>
            <Button size="lg" className="w-full sm:w-auto">
              Browse Books
            </Button>
          </Link>
          <Link href={ROUTES.BUNDLES}>
            <Button variant="outline" size="lg" className="w-full sm:w-auto">
              View Bundles
            </Button>
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16">
        <h2 className="text-3xl font-bold text-center mb-12">
          Why Choose {APP_NAME}?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Vast Library</CardTitle>
              <CardDescription>
                Access thousands of digital books across all genres
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                From bestsellers to indie gems, find your next favorite read in
                our carefully curated collection.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Curated Bundles</CardTitle>
              <CardDescription>
                Save money with themed book collections
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Get multiple related books at discounted prices with our
                expertly curated bundles.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Reading Progress</CardTitle>
              <CardDescription>
                Track your reading journey and never lose your place
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Sync your reading progress across devices and pick up right
                where you left off.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="text-center py-16 bg-muted rounded-lg">
        <h2 className="text-3xl font-bold mb-4">
          Start Your Reading Journey Today
        </h2>
        <p className="text-lg text-muted-foreground mb-8">
          Join thousands of readers who have made {APP_NAME} their digital
          library
        </p>
        <Link href={ROUTES.AUTH.REGISTER}>
          <Button size="lg">Get Started Free</Button>
        </Link>
      </section>
    </div>
  );
}