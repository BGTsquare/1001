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
import { ROUTES, APP_NAME, APP_DESCRIPTION } from '@/utils/constants';
import { FeaturedBooks } from '@/components/home/featured-books';
import { FeaturedBundles } from '@/components/home/featured-bundles';
import { RecentBlogPosts } from '@/components/home/recent-blog-posts';
import { BookOpen, Users, TrendingUp, Star } from 'lucide-react';
import { generateWebSiteStructuredData, generateOrganizationStructuredData } from '@/lib/seo/structured-data';
import { MultipleStructuredData } from '@/components/seo/structured-data';
import { generateMetadata } from '@/lib/seo/metadata';

export const metadata = generateMetadata({
  title: APP_NAME,
  description: APP_DESCRIPTION,
  url: '/',
  type: 'website',
  tags: ['digital bookstore', 'ebooks', 'online books', 'reading', 'book bundles'],
});

export default function Home() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://astewai-bookstore.com';

  // Generate structured data
  const websiteStructuredData = generateWebSiteStructuredData(baseUrl, APP_NAME);
  const organizationStructuredData = generateOrganizationStructuredData({
    name: APP_NAME,
    url: baseUrl,
    description: APP_DESCRIPTION,
    contactPoint: {
      contactType: 'customer service',
      email: 'support@astewai-bookstore.com',
    },
  });

  return (
    <>
      <MultipleStructuredData
        dataArray={[
          { data: websiteStructuredData, id: 'website-structured-data' },
          { data: organizationStructuredData, id: 'organization-structured-data' },
        ]}
      />
      {/* Enhanced Hero Section with gradient background */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-warm opacity-60"></div>
        <div className="relative container-mobile py-12 sm:py-16 lg:py-24">
          <div className="text-center animate-fade-in">
            <div className="mb-6 sm:mb-8">
              <h1 className="heading-responsive-xl mb-4 sm:mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Reading, Redefined
              </h1>
              <p className="text-mobile-lg sm:text-xl text-muted-foreground mb-2 max-w-2xl mx-auto px-4">
                Explore a new dimension of literature
              </p>
              <p className="text-mobile-base sm:text-lg text-muted-foreground/80 mb-8 sm:mb-10 max-w-xl mx-auto px-4">
                Discover, purchase, and read digital books from your favorite authors.
                Build your personal library and track your reading progress.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center px-4 animate-slide-up">
              <Link href={ROUTES.BOOKS} className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto button-mobile shadow-medium hover-lift">
                  Explore Collection
                </Button>
              </Link>
              <Link href={ROUTES.BUNDLES} className="w-full sm:w-auto">
                <Button variant="outline" size="lg" className="w-full sm:w-auto button-mobile glass-card hover-lift">
                  View Bundles
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="container-mobile py-6 sm:py-8">
      {/* Featured Books Section */}
      <section className="py-8 sm:py-12 lg:py-16 animate-slide-up">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 sm:mb-10 gap-4">
          <div>
            <h2 className="heading-responsive-lg mb-3 text-primary">Featured Transmissions</h2>
            <p className="text-mobile-base text-muted-foreground">
              Discover our handpicked selection of must-read books
            </p>
          </div>
          <Link href={ROUTES.BOOKS}>
            <Button variant="outline" className="button-mobile w-full sm:w-auto glass-card hover-lift">
              View All Books
            </Button>
          </Link>
        </div>
        <div className="glass-card p-6 sm:p-8">
          <Suspense fallback={
            <div className="text-center py-12">
              <div className="animate-pulse">Loading featured books...</div>
            </div>
          }>
            <FeaturedBooks />
          </Suspense>
        </div>
      </section>

      {/* Featured Bundles Section */}
      <section className="py-8 sm:py-12 lg:py-16 animate-slide-up">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 sm:mb-10 gap-4">
          <div>
            <h2 className="heading-responsive-lg mb-3 text-primary">A Curated Reading Experience</h2>
            <p className="text-mobile-base text-muted-foreground">
              Save more with our expertly curated book collections
            </p>
          </div>
          <Link href={ROUTES.BUNDLES}>
            <Button variant="outline" className="button-mobile w-full sm:w-auto glass-card hover-lift">
              View All Bundles
            </Button>
          </Link>
        </div>
        <div className="glass-card p-6 sm:p-8">
          <Suspense fallback={
            <div className="text-center py-12">
              <div className="animate-pulse">Loading featured bundles...</div>
            </div>
          }>
            <FeaturedBundles />
          </Suspense>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-8 sm:py-12 lg:py-16 animate-slide-up">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
          <div className="text-center glass-card p-6 hover-lift">
            <div className="flex justify-center mb-4">
              <div className="p-3 rounded-full gradient-primary">
                <BookOpen className="h-6 w-6 sm:h-8 sm:w-8 text-primary-foreground" />
              </div>
            </div>
            <div className="text-mobile-2xl sm:text-3xl font-bold mb-2 text-primary">1000+</div>
            <div className="text-mobile-xs sm:text-sm text-muted-foreground font-medium">Books Available</div>
          </div>
          <div className="text-center glass-card p-6 hover-lift">
            <div className="flex justify-center mb-4">
              <div className="p-3 rounded-full gradient-primary">
                <Users className="h-6 w-6 sm:h-8 sm:w-8 text-primary-foreground" />
              </div>
            </div>
            <div className="text-mobile-2xl sm:text-3xl font-bold mb-2 text-primary">5000+</div>
            <div className="text-mobile-xs sm:text-sm text-muted-foreground font-medium">Happy Readers</div>
          </div>
          <div className="text-center glass-card p-6 hover-lift">
            <div className="flex justify-center mb-4">
              <div className="p-3 rounded-full gradient-primary">
                <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-primary-foreground" />
              </div>
            </div>
            <div className="text-mobile-2xl sm:text-3xl font-bold mb-2 text-primary">50+</div>
            <div className="text-mobile-xs sm:text-sm text-muted-foreground font-medium">Book Bundles</div>
          </div>
          <div className="text-center glass-card p-6 hover-lift">
            <div className="flex justify-center mb-4">
              <div className="p-3 rounded-full gradient-primary">
                <Star className="h-6 w-6 sm:h-8 sm:w-8 text-primary-foreground" />
              </div>
            </div>
            <div className="text-mobile-2xl sm:text-3xl font-bold mb-2 text-primary">4.8</div>
            <div className="text-mobile-xs sm:text-sm text-muted-foreground font-medium">Average Rating</div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-8 sm:py-12 lg:py-16 animate-slide-up">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="heading-responsive-lg mb-4 text-primary">
            Why Choose {APP_NAME}?
          </h2>
          <p className="text-mobile-base text-muted-foreground max-w-2xl mx-auto">
            Experience the future of digital reading with our innovative platform
          </p>
        </div>
        <div className="grid-responsive-features">
          <Card className="card-enhanced hover-lift">
            <CardHeader className="pb-4">
              <div className="w-12 h-12 rounded-full gradient-accent flex items-center justify-center mb-4">
                <BookOpen className="h-6 w-6 text-accent-foreground" />
              </div>
              <CardTitle className="text-mobile-lg sm:text-xl text-primary">Vast Library</CardTitle>
              <CardDescription className="text-mobile-sm">
                Access thousands of digital books across all genres
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-mobile-sm text-muted-foreground leading-relaxed">
                From bestsellers to indie gems, find your next favorite read in
                our carefully curated collection.
              </p>
            </CardContent>
          </Card>

          <Card className="card-enhanced hover-lift">
            <CardHeader className="pb-4">
              <div className="w-12 h-12 rounded-full gradient-accent flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-accent-foreground" />
              </div>
              <CardTitle className="text-mobile-lg sm:text-xl text-primary">Curated Bundles</CardTitle>
              <CardDescription className="text-mobile-sm">
                Save money with themed book collections
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-mobile-sm text-muted-foreground leading-relaxed">
                Get multiple related books at discounted prices with our
                expertly curated bundles.
              </p>
            </CardContent>
          </Card>

          <Card className="card-enhanced hover-lift">
            <CardHeader className="pb-4">
              <div className="w-12 h-12 rounded-full gradient-accent flex items-center justify-center mb-4">
                <TrendingUp className="h-6 w-6 text-accent-foreground" />
              </div>
              <CardTitle className="text-mobile-lg sm:text-xl text-primary">Reading Progress</CardTitle>
              <CardDescription className="text-mobile-sm">
                Track your reading journey and never lose your place
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-mobile-sm text-muted-foreground leading-relaxed">
                Sync your reading progress across devices and pick up right
                where you left off.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Recent Blog Posts Section */}
      <section className="py-12 sm:py-16 animate-slide-up">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 sm:mb-10 gap-4">
          <div>
            <h2 className="heading-responsive-lg mb-3 text-primary">Latest from Our Blog</h2>
            <p className="text-mobile-base text-muted-foreground">
              Stay updated with book reviews, author interviews, and reading tips
            </p>
          </div>
          <Link href={ROUTES.BLOG}>
            <Button variant="outline" className="glass-card hover-lift w-full sm:w-auto">
              View All Posts
            </Button>
          </Link>
        </div>
        <div className="glass-card p-6 sm:p-8">
          <Suspense fallback={
            <div className="text-center py-12">
              <div className="animate-pulse">Loading blog posts...</div>
            </div>
          }>
            <RecentBlogPosts />
          </Suspense>
        </div>
      </section>

      {/* Enhanced CTA Section */}
      <section className="relative overflow-hidden rounded-2xl animate-scale-in">
        <div className="absolute inset-0 gradient-primary opacity-90"></div>
        <div className="relative text-center py-16 sm:py-20 px-6">
          <h2 className="heading-responsive-lg mb-6 text-primary-foreground">
            Start Your Reading Journey Today
          </h2>
          <p className="text-mobile-lg sm:text-xl text-primary-foreground/90 mb-8 max-w-2xl mx-auto leading-relaxed">
            Join thousands of readers who have made {APP_NAME} their digital
            library and discover your next favorite book
          </p>
          <Link href={ROUTES.AUTH.REGISTER}>
            <Button size="lg" variant="secondary" className="shadow-strong hover-lift text-lg px-8 py-3">
              Get Started Free
            </Button>
          </Link>
        </div>
      </section>
      </div>
    </>
  );
}