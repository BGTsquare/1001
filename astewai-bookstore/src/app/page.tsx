import Link from 'next/link';
import { Suspense } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ROUTES, APP_NAME } from '@/utils/constants';
import { FeaturedBooks } from '@/components/home/featured-books';
import { FeaturedBundles } from '@/components/home/featured-bundles';
import { RecentBlogPosts } from '@/components/home/recent-blog-posts';
import { BookOpen, Users, TrendingUp, Star } from 'lucide-react';

export default function Home() {
  return (
    <div className="container-mobile py-6 sm:py-8">
      {/* Hero Section */}
      <section className="text-center py-8 sm:py-12 lg:py-16">
        <h1 className="heading-responsive-xl mb-4 sm:mb-6">
          Welcome to {APP_NAME}
        </h1>
        <p className="text-mobile-lg sm:text-xl text-muted-foreground mb-6 sm:mb-8 max-w-2xl mx-auto px-4">
          Discover, purchase, and read digital books from your favorite authors.
          Build your personal library and track your reading progress.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4">
          <Link href={ROUTES.BOOKS} className="w-full sm:w-auto">
            <Button size="lg" className="w-full sm:w-auto button-mobile">
              Browse Books
            </Button>
          </Link>
          <Link href={ROUTES.BUNDLES} className="w-full sm:w-auto">
            <Button variant="outline" size="lg" className="w-full sm:w-auto button-mobile">
              View Bundles
            </Button>
          </Link>
        </div>
      </section>

      {/* Featured Books Section */}
      <section className="py-8 sm:py-12 lg:py-16">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8 gap-4">
          <div>
            <h2 className="heading-responsive-lg mb-2">Featured Books</h2>
            <p className="text-mobile-base text-muted-foreground">
              Discover our handpicked selection of must-read books
            </p>
          </div>
          <Link href={ROUTES.BOOKS}>
            <Button variant="outline" className="button-mobile w-full sm:w-auto">View All Books</Button>
          </Link>
        </div>
        <Suspense fallback={<div className="text-center py-8">Loading featured books...</div>}>
          <FeaturedBooks />
        </Suspense>
      </section>

      {/* Featured Bundles Section */}
      <section className="py-8 sm:py-12 lg:py-16">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8 gap-4">
          <div>
            <h2 className="heading-responsive-lg mb-2">Popular Bundles</h2>
            <p className="text-mobile-base text-muted-foreground">
              Save more with our curated book collections
            </p>
          </div>
          <Link href={ROUTES.BUNDLES}>
            <Button variant="outline" className="button-mobile w-full sm:w-auto">View All Bundles</Button>
          </Link>
        </div>
        <Suspense fallback={<div className="text-center py-8">Loading featured bundles...</div>}>
          <FeaturedBundles />
        </Suspense>
      </section>

      {/* Stats Section */}
      <section className="py-8 sm:py-12 lg:py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
          <div className="text-center">
            <div className="flex justify-center mb-3 sm:mb-4">
              <BookOpen className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
            </div>
            <div className="text-mobile-2xl sm:text-3xl font-bold mb-1 sm:mb-2">1000+</div>
            <div className="text-mobile-xs sm:text-sm text-muted-foreground">Books Available</div>
          </div>
          <div className="text-center">
            <div className="flex justify-center mb-3 sm:mb-4">
              <Users className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
            </div>
            <div className="text-mobile-2xl sm:text-3xl font-bold mb-1 sm:mb-2">5000+</div>
            <div className="text-mobile-xs sm:text-sm text-muted-foreground">Happy Readers</div>
          </div>
          <div className="text-center">
            <div className="flex justify-center mb-3 sm:mb-4">
              <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
            </div>
            <div className="text-mobile-2xl sm:text-3xl font-bold mb-1 sm:mb-2">50+</div>
            <div className="text-mobile-xs sm:text-sm text-muted-foreground">Book Bundles</div>
          </div>
          <div className="text-center">
            <div className="flex justify-center mb-3 sm:mb-4">
              <Star className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
            </div>
            <div className="text-mobile-2xl sm:text-3xl font-bold mb-1 sm:mb-2">4.8</div>
            <div className="text-mobile-xs sm:text-sm text-muted-foreground">Average Rating</div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-8 sm:py-12 lg:py-16">
        <h2 className="heading-responsive-lg text-center mb-8 sm:mb-12">
          Why Choose {APP_NAME}?
        </h2>
        <div className="grid-responsive-features">
          <Card className="card-mobile">
            <CardHeader>
              <CardTitle className="text-mobile-lg sm:text-xl">Vast Library</CardTitle>
              <CardDescription className="text-mobile-sm">
                Access thousands of digital books across all genres
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-mobile-sm text-muted-foreground">
                From bestsellers to indie gems, find your next favorite read in
                our carefully curated collection.
              </p>
            </CardContent>
          </Card>

          <Card className="card-mobile">
            <CardHeader>
              <CardTitle className="text-mobile-lg sm:text-xl">Curated Bundles</CardTitle>
              <CardDescription className="text-mobile-sm">
                Save money with themed book collections
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-mobile-sm text-muted-foreground">
                Get multiple related books at discounted prices with our
                expertly curated bundles.
              </p>
            </CardContent>
          </Card>

          <Card className="card-mobile">
            <CardHeader>
              <CardTitle className="text-mobile-lg sm:text-xl">Reading Progress</CardTitle>
              <CardDescription className="text-mobile-sm">
                Track your reading journey and never lose your place
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-mobile-sm text-muted-foreground">
                Sync your reading progress across devices and pick up right
                where you left off.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Recent Blog Posts Section */}
      <section className="py-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold mb-2">Latest from Our Blog</h2>
            <p className="text-muted-foreground">
              Stay updated with book reviews, author interviews, and reading tips
            </p>
          </div>
          <Link href={ROUTES.BLOG}>
            <Button variant="outline">View All Posts</Button>
          </Link>
        </div>
        <Suspense fallback={<div className="text-center py-8">Loading blog posts...</div>}>
          <RecentBlogPosts />
        </Suspense>
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