import { Suspense } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Users, Award, Target, Heart, Lightbulb } from 'lucide-react';
import { generateMetadata } from '@/lib/seo/metadata';
import { generateBreadcrumbStructuredData } from '@/lib/seo/structured-data';
import { StructuredData } from '@/components/seo/structured-data';

export const metadata = generateMetadata({
  title: 'About Us - Astewai Digital Bookstore',
  description: "Learn about Astewai Digital Bookstore's mission to make quality digital books accessible to everyone. Discover our story, values, and commitment to readers.",
  url: '/about',
  type: 'website',
  tags: ['about', 'company', 'mission', 'digital books', 'reading'],
});

export default function AboutPage() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://astewai-bookstore.com';
  const breadcrumbData = [
    { name: 'Home', url: baseUrl },
    { name: 'About', url: `${baseUrl}/about` },
  ];
  const breadcrumbStructuredData = generateBreadcrumbStructuredData(breadcrumbData);

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <div className="container mx-auto px-4 py-8">
        <StructuredData data={breadcrumbStructuredData} id="about-breadcrumb" />
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">About Astewai Digital Bookstore</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            We're passionate about making quality digital books accessible to everyone, 
            fostering a love for reading in the digital age.
          </p>
        </div>

        {/* Mission & Vision */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2 mb-2">
                <Target className="h-6 w-6 text-primary" />
                <CardTitle className="text-2xl">Our Mission</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                To democratize access to quality digital literature by providing an intuitive, 
                affordable platform where readers can discover, purchase, and enjoy books from 
                diverse authors and genres. We believe that great stories should be accessible 
                to everyone, regardless of their location or circumstances.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2 mb-2">
                <Lightbulb className="h-6 w-6 text-primary" />
                <CardTitle className="text-2xl">Our Story</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed mb-6">
                Astewai Digital Bookstore was born from a simple observation: while digital 
                technology has transformed how we consume media, the book discovery and reading 
                experience hadn't kept pace with modern expectations.
              </p>
              <p className="mb-6">
                Founded in 2024, we set out to create a platform that combines the joy of 
                book discovery with the convenience of digital reading. Our team of book 
                lovers, technologists, and design enthusiasts came together with a shared 
                vision of making reading more accessible and enjoyable.
              </p>
              <p>
                Today, we're proud to serve thousands of readers worldwide, offering carefully 
                curated collections, innovative bundle deals, and a seamless reading experience 
                that puts the reader first.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Core Values */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-8">Our Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2 mb-2">
                  <BookOpen className="h-6 w-6 text-primary" />
                  <CardTitle>Quality First</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  We carefully curate our collection to ensure every book meets our high 
                  standards for content, formatting, and reader experience.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2 mb-2">
                  <Users className="h-6 w-6 text-primary" />
                  <CardTitle>Community</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  We foster a vibrant community of readers and authors, encouraging engagement, 
                  discussion, and shared discovery.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2 mb-2">
                  <Award className="h-6 w-6 text-primary" />
                  <CardTitle>Innovation</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  We embrace technology to continually improve the reading experience, 
                  making it more accessible, enjoyable, and interactive.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* What We Offer */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-8">What We Offer</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <Badge variant="secondary" className="mt-1">01</Badge>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Curated Book Collection</h3>
                  <p className="text-muted-foreground">
                    Thousands of carefully selected digital books across all genres, 
                    from bestsellers to hidden gems.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <Badge variant="secondary" className="mt-1">02</Badge>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Bundle Deals</h3>
                  <p className="text-muted-foreground">
                    Themed book bundles at discounted prices, perfect for exploring 
                    new genres or building your digital library.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <Badge variant="secondary" className="mt-1">03</Badge>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Personal Library</h3>
                  <p className="text-muted-foreground">
                    Track your reading progress, organize your collection, and 
                    access your books from any device.
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <Badge variant="secondary" className="mt-1">04</Badge>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Reading Community</h3>
                  <p className="text-muted-foreground">
                    Connect with fellow readers through our blog and community 
                    features, sharing recommendations and insights.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <Badge variant="secondary" className="mt-1">05</Badge>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Author Support</h3>
                  <p className="text-muted-foreground">
                    We work directly with authors and publishers to ensure fair 
                    compensation and proper attribution.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <Badge variant="secondary" className="mt-1">06</Badge>
                <div>
                  <h3 className="text-xl font-semibold mb-2">24/7 Support</h3>
                  <p className="text-muted-foreground">
                    Our dedicated support team is always ready to help with any 
                    questions or technical issues you might encounter.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <Card className="max-w-2xl mx-auto">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold mb-4">Join Our Reading Community</h2>
              <p className="text-muted-foreground mb-6">
                Discover your next favorite book and connect with fellow readers. 
                Start your digital reading journey with us today.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a 
                  href="/books" 
                  className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  Browse Books
                </a>
                <a 
                  href="/bundles" 
                  className="inline-flex items-center justify-center rounded-md border border-input bg-background px-6 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  Explore Bundles
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Suspense>
  );
}
// ...existing code...