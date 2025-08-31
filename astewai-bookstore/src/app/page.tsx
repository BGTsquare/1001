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
      {/* Modern Hero Section with glassmorphism */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-purple-50/20 to-pink-50/30 dark:from-blue-950/30 dark:via-purple-950/20 dark:to-pink-950/30"></div>
        <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-r from-pink-400/20 to-orange-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-green-400/10 to-blue-400/10 rounded-full blur-2xl animate-pulse delay-500"></div>

        <div className="relative container-mobile py-12 sm:py-16 lg:py-24 z-10">
          <div className="text-center animate-fade-in">
            {/* Glassmorphism hero card */}
            <div className="backdrop-blur-xl bg-white/10 dark:bg-black/10 border border-white/20 dark:border-white/10 rounded-3xl p-8 sm:p-12 lg:p-16 shadow-2xl">
              <div className="mb-8 sm:mb-12">
                <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold mb-6 sm:mb-8 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent leading-tight">
                  Reading,<br />Redefined
                </h1>
                <p className="text-lg sm:text-xl lg:text-2xl text-gray-700 dark:text-gray-300 mb-4 max-w-3xl mx-auto leading-relaxed">
                  Discover a new dimension of digital literature
                </p>
                <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 mb-10 sm:mb-12 max-w-2xl mx-auto leading-relaxed">
                  Explore thousands of carefully curated books, exclusive bundles, and immersive reading experiences designed for the modern reader
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center mb-8 sm:mb-12">
                <Link href={ROUTES.BOOKS}>
                  <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 text-lg px-10 py-4 rounded-2xl">
                    Explore Books
                  </Button>
                </Link>
                <Link href={ROUTES.BUNDLES}>
                  <Button size="lg" variant="outline" className="w-full sm:w-auto backdrop-blur-sm bg-white/20 dark:bg-black/20 border-white/30 dark:border-white/20 hover:bg-white/30 dark:hover:bg-black/30 text-gray-800 dark:text-gray-200 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 text-lg px-10 py-4 rounded-2xl">
                    View Collections
                  </Button>
                </Link>
              </div>

              {/* Stats section */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8 mt-12">
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">1000+</div>
                  <div className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Digital Books</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">50+</div>
                  <div className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Curated Bundles</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl font-bold text-pink-600 dark:text-pink-400 mb-2">10K+</div>
                  <div className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Happy Readers</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl font-bold text-green-600 dark:text-green-400 mb-2">24/7</div>
                  <div className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Access</div>
                </div>
              </div>
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

      {/* Modern Features Section */}
      <section className="py-16 sm:py-20 lg:py-24 relative">
        {/* Background elements */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-50/20 to-transparent dark:via-blue-950/20"></div>

        <div className="relative container-mobile">
          <div className="text-center mb-16 sm:mb-20">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Why Choose {APP_NAME}?
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto leading-relaxed">
              Experience the future of digital reading with our innovative platform designed for modern readers
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12">
            {/* Feature 1 */}
            <div className="group">
              <div className="backdrop-blur-xl bg-white/10 dark:bg-black/10 border border-white/20 dark:border-white/10 rounded-2xl p-8 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <BookOpen className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">Vast Digital Library</h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  Access thousands of carefully curated digital books across all genres, from bestsellers to hidden gems waiting to be discovered.
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="group">
              <div className="backdrop-blur-xl bg-white/10 dark:bg-black/10 border border-white/20 dark:border-white/10 rounded-2xl p-8 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">Curated Collections</h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  Save money with expertly curated book bundles and themed collections designed to enhance your reading journey.
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="group">
              <div className="backdrop-blur-xl bg-white/10 dark:bg-black/10 border border-white/20 dark:border-white/10 rounded-2xl p-8 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-pink-500 to-orange-500 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <TrendingUp className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">Smart Progress Tracking</h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  Sync your reading progress across all devices and never lose your place with our intelligent tracking system.
                </p>
              </div>
            </div>
          </div>
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

      {/* Modern CTA Section */}
      <section className="relative overflow-hidden py-16 sm:py-20 lg:py-24">
        {/* Background elements */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-pink-600/10"></div>
        <div className="absolute top-10 left-10 w-64 h-64 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-10 right-10 w-80 h-80 bg-gradient-to-r from-pink-400/20 to-orange-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>

        <div className="relative container-mobile">
          <div className="backdrop-blur-xl bg-white/10 dark:bg-black/10 border border-white/20 dark:border-white/10 rounded-3xl p-12 sm:p-16 lg:p-20 shadow-2xl text-center">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Start Your Reading Journey Today
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400 mb-10 sm:mb-12 max-w-3xl mx-auto leading-relaxed">
              Join thousands of readers who have made {APP_NAME} their digital library and discover your next favorite book in our carefully curated collection
            </p>

            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center">
              <Link href={ROUTES.AUTH.REGISTER}>
                <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 text-lg px-12 py-4 rounded-2xl">
                  Get Started Free
                </Button>
              </Link>
              <Link href={ROUTES.BOOKS}>
                <Button size="lg" variant="outline" className="w-full sm:w-auto backdrop-blur-sm bg-white/20 dark:bg-black/20 border-white/30 dark:border-white/20 hover:bg-white/30 dark:hover:bg-black/30 text-gray-800 dark:text-gray-200 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 text-lg px-12 py-4 rounded-2xl">
                  Browse Library
                </Button>
              </Link>
            </div>

            {/* Trust indicators */}
            <div className="mt-12 pt-8 border-t border-white/20 dark:border-white/10">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Trusted by readers worldwide</p>
              <div className="flex justify-center items-center space-x-8 opacity-60">
                <div className="text-xs font-medium">✓ Instant Access</div>
                <div className="text-xs font-medium">✓ No Subscription</div>
                <div className="text-xs font-medium">✓ Lifetime Access</div>
                <div className="text-xs font-medium">✓ 24/7 Support</div>
              </div>
            </div>
          </div>
        </div>
      </section>
      </div>
    </>
  );
}