import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ArrowRight, Clock, User } from 'lucide-react';
import { generateMetadata } from '@/lib/seo/metadata';
import { generateBreadcrumbStructuredData } from '@/lib/seo/structured-data';
import { StructuredData } from '@/components/seo/structured-data';

export const metadata = generateMetadata({
  title: 'Getting Started Guide - Astewai Digital Bookstore Help',
  description: 'Complete guide to getting started with Astewai Digital Bookstore. Learn how to create an account, browse books, and make your first purchase.',
  url: '/help/getting-started',
  type: 'article',
  tags: ['getting started', 'tutorial', 'guide', 'new user', 'help'],
});

export default function GettingStartedPage() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://astewai-bookstore.com';

  const breadcrumbStructuredData = generateBreadcrumbStructuredData([
    { name: 'Home', url: baseUrl },
    { name: 'Help Center', url: `${baseUrl}/help` },
    { name: 'Getting Started', url: `${baseUrl}/help/getting-started` },
  ]);

  return (
    <>
      <StructuredData data={breadcrumbStructuredData} id="getting-started-breadcrumb" />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Navigation */}
          <div className="mb-6">
            <a 
              href="/help" 
              className="inline-flex items-center text-primary hover:underline"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Help Center
            </a>
          </div>

          {/* Article Header */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Badge variant="secondary">Getting Started</Badge>
              <Badge variant="outline">Guide</Badge>
            </div>
            <h1 className="text-4xl font-bold mb-4">Getting Started with Astewai Digital Bookstore</h1>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                5 min read
              </div>
              <div className="flex items-center">
                <User className="h-4 w-4 mr-1" />
                Last updated: January 1, 2024
              </div>
            </div>
          </div>

          {/* Table of Contents */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>In This Guide</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                <a href="#step-1" className="text-primary hover:underline">1. Creating Your Account</a>
                <a href="#step-2" className="text-primary hover:underline">2. Exploring the Platform</a>
                <a href="#step-3" className="text-primary hover:underline">3. Finding Books</a>
                <a href="#step-4" className="text-primary hover:underline">4. Making Your First Purchase</a>
                <a href="#step-5" className="text-primary hover:underline">5. Reading Your Books</a>
                <a href="#next-steps" className="text-primary hover:underline">6. Next Steps</a>
              </div>
            </CardContent>
          </Card>

          {/* Article Content */}
          <div className="prose prose-lg max-w-none space-y-8">
            <Card id="step-1">
              <CardHeader>
                <CardTitle className="text-2xl">Step 1: Creating Your Account</CardTitle>
              </CardHeader>
              <CardContent className="prose max-w-none">
                <p>
                  Welcome to Astewai Digital Bookstore! Getting started is easy and takes just a few minutes.
                </p>
                
                <h4>To create your account:</h4>
                <ol>
                  <li>Click the <strong>"Register"</strong> button in the top navigation</li>
                  <li>Enter your email address and create a secure password</li>
                  <li>Check your email for a verification link</li>
                  <li>Click the verification link to activate your account</li>
                  <li>You'll be automatically logged in and ready to start!</li>
                </ol>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 my-4">
                  <h5 className="font-medium text-blue-900 mb-2">💡 Pro Tip</h5>
                  <p className="text-blue-800 text-sm mb-0">
                    Use a strong password and consider enabling two-factor authentication for added security.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card id="step-2">
              <CardHeader>
                <CardTitle className="text-2xl">Step 2: Exploring the Platform</CardTitle>
              </CardHeader>
              <CardContent className="prose max-w-none">
                <p>
                  Once you're logged in, take a moment to familiarize yourself with the main sections:
                </p>

                <ul>
                  <li><strong>Home:</strong> Featured books, recommendations, and latest additions</li>
                  <li><strong>Books:</strong> Browse our complete catalog of digital books</li>
                  <li><strong>Bundles:</strong> Curated collections at discounted prices</li>
                  <li><strong>Library:</strong> Your personal collection of owned books</li>
                  <li><strong>Profile:</strong> Manage your account settings and preferences</li>
                </ul>

                <p>
                  The navigation is consistent across all pages, making it easy to move between sections.
                </p>
              </CardContent>
            </Card>

            <Card id="step-3">
              <CardHeader>
                <CardTitle className="text-2xl">Step 3: Finding Books</CardTitle>
              </CardHeader>
              <CardContent className="prose max-w-none">
                <p>
                  There are several ways to discover books on our platform:
                </p>

                <h4>Search and Browse</h4>
                <ul>
                  <li>Use the search bar to find specific titles or authors</li>
                  <li>Browse by categories and genres</li>
                  <li>Check out our featured and recommended sections</li>
                  <li>Explore curated bundles for themed collections</li>
                </ul>

                <h4>Book Details</h4>
                <p>
                  Click on any book to see detailed information including:
                </p>
                <ul>
                  <li>Book description and author information</li>
                  <li>Preview of the content</li>
                  <li>Pricing (free or paid)</li>
                  <li>User reviews and ratings</li>
                </ul>
              </CardContent>
            </Card>

            <Card id="step-4">
              <CardHeader>
                <CardTitle className="text-2xl">Step 4: Making Your First Purchase</CardTitle>
              </CardHeader>
              <CardContent className="prose max-w-none">
                <p>
                  Our platform uses a manual approval system for purchases to ensure security and quality service.
                </p>

                <h4>For Free Books:</h4>
                <ol>
                  <li>Click "Add to Library" on any free book</li>
                  <li>The book is immediately added to your library</li>
                  <li>Start reading right away!</li>
                </ol>

                <h4>For Paid Books:</h4>
                <ol>
                  <li>Click "Buy Now" on the book page</li>
                  <li>Review the purchase details</li>
                  <li>Submit your purchase request</li>
                  <li>Wait for admin approval (usually 24-48 hours)</li>
                  <li>Receive email notification when approved</li>
                  <li>Complete payment through our secure system</li>
                  <li>Book is added to your library automatically</li>
                </ol>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4 my-4">
                  <h5 className="font-medium text-green-900 mb-2">✅ Why Manual Approval?</h5>
                  <p className="text-green-800 text-sm mb-0">
                    Our manual approval process helps prevent fraud, ensures quality service, and allows us to provide personalized support for each purchase.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card id="step-5">
              <CardHeader>
                <CardTitle className="text-2xl">Step 5: Reading Your Books</CardTitle>
              </CardHeader>
              <CardContent className="prose max-w-none">
                <p>
                  Once books are in your library, you can start reading immediately.
                </p>

                <h4>Using the Reader:</h4>
                <ul>
                  <li>Click "Read" on any book in your library</li>
                  <li>Adjust font size, theme, and other reading preferences</li>
                  <li>Your reading progress is saved automatically</li>
                  <li>Use bookmarks to mark important sections</li>
                  <li>Resume reading from any device</li>
                </ul>

                <h4>Library Organization:</h4>
                <p>
                  Your library is organized into tabs:
                </p>
                <ul>
                  <li><strong>All:</strong> Complete collection of your books</li>
                  <li><strong>In Progress:</strong> Books you're currently reading</li>
                  <li><strong>Completed:</strong> Books you've finished</li>
                </ul>
              </CardContent>
            </Card>

            <Card id="next-steps">
              <CardHeader>
                <CardTitle className="text-2xl">Next Steps</CardTitle>
              </CardHeader>
              <CardContent className="prose max-w-none">
                <p>
                  Now that you're set up, here are some things to explore:
                </p>

                <ul>
                  <li><strong>Customize your profile:</strong> Add a display name and avatar</li>
                  <li><strong>Set reading preferences:</strong> Choose your preferred themes and settings</li>
                  <li><strong>Explore bundles:</strong> Save money with curated book collections</li>
                  <li><strong>Join the community:</strong> Read our blog and engage with other readers</li>
                  <li><strong>Enable notifications:</strong> Stay updated on new releases and recommendations</li>
                </ul>

                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 my-4">
                  <h5 className="font-medium text-purple-900 mb-2">🎉 Welcome to Astewai!</h5>
                  <p className="text-purple-800 text-sm mb-0">
                    You're all set to start your digital reading journey. Happy reading!
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Related Articles */}
          <Card className="mt-12">
            <CardHeader>
              <CardTitle>Related Help Articles</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <a href="/help/reading/book-reader" className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent transition-colors">
                  <span className="font-medium">Using the Book Reader</span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </a>
                <a href="/help/payments/approval-process" className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent transition-colors">
                  <span className="font-medium">Purchase Approval Process</span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </a>
                <a href="/help/reading/library-management" className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent transition-colors">
                  <span className="font-medium">Managing Your Library</span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </a>
                <a href="/help/account/settings" className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent transition-colors">
                  <span className="font-medium">Account Settings</span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </a>
              </div>
            </CardContent>
          </Card>

          {/* Feedback */}
          <Card className="mt-8">
            <CardContent className="text-center p-6">
              <h3 className="font-medium mb-2">Was this article helpful?</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Let us know how we can improve our documentation.
              </p>
              <div className="flex gap-2 justify-center">
                <button className="px-4 py-2 text-sm border rounded-md hover:bg-accent transition-colors">
                  👍 Yes, helpful
                </button>
                <button className="px-4 py-2 text-sm border rounded-md hover:bg-accent transition-colors">
                  👎 Needs improvement
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}