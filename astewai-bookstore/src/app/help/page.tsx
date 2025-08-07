import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  BookOpen, 
  CreditCard, 
  User, 
  Settings, 
  Search,
  ArrowRight,
  HelpCircle,
  FileText,
  Video,
  MessageSquare
} from 'lucide-react';
import { generateMetadata } from '@/lib/seo/metadata';
import { generateBreadcrumbStructuredData } from '@/lib/seo/structured-data';
import { StructuredData } from '@/components/seo/structured-data';

export const metadata = generateMetadata({
  title: 'Help Center - Astewai Digital Bookstore',
  description: 'Get help and support for Astewai Digital Bookstore. Find guides, tutorials, and documentation for all platform features.',
  url: '/help',
  type: 'website',
  tags: ['help', 'support', 'documentation', 'guides', 'tutorials'],
});

export default function HelpPage() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://astewai-bookstore.com';

  const breadcrumbStructuredData = generateBreadcrumbStructuredData([
    { name: 'Home', url: baseUrl },
    { name: 'Help Center', url: `${baseUrl}/help` },
  ]);

  const helpCategories = [
    {
      title: 'Getting Started',
      description: 'New to Astewai? Learn the basics',
      icon: User,
      articles: [
        { title: 'Creating Your Account', url: '/help/getting-started/account-creation' },
        { title: 'Your First Book Purchase', url: '/help/getting-started/first-purchase' },
        { title: 'Navigating the Platform', url: '/help/getting-started/navigation' },
        { title: 'Setting Up Your Profile', url: '/help/getting-started/profile-setup' }
      ]
    },
    {
      title: 'Reading & Library',
      description: 'Manage your books and reading experience',
      icon: BookOpen,
      articles: [
        { title: 'Using the Book Reader', url: '/help/reading/book-reader' },
        { title: 'Managing Your Library', url: '/help/reading/library-management' },
        { title: 'Tracking Reading Progress', url: '/help/reading/progress-tracking' },
        { title: 'Bookmarks and Notes', url: '/help/reading/bookmarks-notes' }
      ]
    },
    {
      title: 'Purchases & Payments',
      description: 'Understanding our payment system',
      icon: CreditCard,
      articles: [
        { title: 'How Purchase Approval Works', url: '/help/payments/approval-process' },
        { title: 'Payment Methods', url: '/help/payments/payment-methods' },
        { title: 'Bundle Purchases', url: '/help/payments/bundle-purchases' },
        { title: 'Refunds and Cancellations', url: '/help/payments/refunds' }
      ]
    },
    {
      title: 'Account & Settings',
      description: 'Manage your account and preferences',
      icon: Settings,
      articles: [
        { title: 'Account Settings', url: '/help/account/settings' },
        { title: 'Privacy Controls', url: '/help/account/privacy' },
        { title: 'Notification Preferences', url: '/help/account/notifications' },
        { title: 'Deleting Your Account', url: '/help/account/deletion' }
      ]
    }
  ];

  const quickActions = [
    {
      title: 'Contact Support',
      description: 'Get help from our team',
      icon: MessageSquare,
      url: '/contact',
      color: 'bg-blue-50 border-blue-200 hover:bg-blue-100'
    },
    {
      title: 'FAQ',
      description: 'Common questions answered',
      icon: HelpCircle,
      url: '/faq',
      color: 'bg-green-50 border-green-200 hover:bg-green-100'
    },
    {
      title: 'Video Tutorials',
      description: 'Watch how-to videos',
      icon: Video,
      url: '/help/videos',
      color: 'bg-purple-50 border-purple-200 hover:bg-purple-100'
    },
    {
      title: 'Documentation',
      description: 'Detailed guides and docs',
      icon: FileText,
      url: '/help/documentation',
      color: 'bg-orange-50 border-orange-200 hover:bg-orange-100'
    }
  ];

  return (
    <>
      <StructuredData data={breadcrumbStructuredData} id="help-breadcrumb" />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4">Help Center</h1>
            <p className="text-muted-foreground text-lg">
              Find guides, tutorials, and answers to help you get the most out of Astewai Digital Bookstore
            </p>
          </div>

          {/* Search */}
          <Card className="mb-8">
            <CardContent className="p-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search help articles..."
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
            {quickActions.map((action, index) => (
              <a
                key={index}
                href={action.url}
                className={`p-6 rounded-lg border-2 transition-colors ${action.color}`}
              >
                <div className="flex items-center mb-3">
                  <action.icon className="h-6 w-6 mr-2" />
                  <h3 className="font-semibold">{action.title}</h3>
                </div>
                <p className="text-sm text-muted-foreground">{action.description}</p>
              </a>
            ))}
          </div>

          {/* Help Categories */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            {helpCategories.map((category, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="flex items-center text-xl">
                    <category.icon className="h-6 w-6 mr-3 text-primary" />
                    {category.title}
                  </CardTitle>
                  <p className="text-muted-foreground">{category.description}</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {category.articles.map((article, articleIndex) => (
                      <a
                        key={articleIndex}
                        href={article.url}
                        className="flex items-center justify-between p-3 rounded-lg hover:bg-accent transition-colors group"
                      >
                        <span className="font-medium">{article.title}</span>
                        <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      </a>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Popular Articles */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-2xl">Popular Help Articles</CardTitle>
              <p className="text-muted-foreground">Most viewed articles this week</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <a href="/help/getting-started/first-purchase" className="flex items-center p-4 rounded-lg border hover:bg-accent transition-colors">
                  <Badge variant="secondary" className="mr-3">1</Badge>
                  <div>
                    <h4 className="font-medium">How to Make Your First Purchase</h4>
                    <p className="text-sm text-muted-foreground">Learn about our approval process</p>
                  </div>
                </a>
                <a href="/help/reading/book-reader" className="flex items-center p-4 rounded-lg border hover:bg-accent transition-colors">
                  <Badge variant="secondary" className="mr-3">2</Badge>
                  <div>
                    <h4 className="font-medium">Using the Book Reader</h4>
                    <p className="text-sm text-muted-foreground">Reading features and controls</p>
                  </div>
                </a>
                <a href="/help/payments/approval-process" className="flex items-center p-4 rounded-lg border hover:bg-accent transition-colors">
                  <Badge variant="secondary" className="mr-3">3</Badge>
                  <div>
                    <h4 className="font-medium">Purchase Approval Process</h4>
                    <p className="text-sm text-muted-foreground">Understanding manual approvals</p>
                  </div>
                </a>
                <a href="/help/reading/library-management" className="flex items-center p-4 rounded-lg border hover:bg-accent transition-colors">
                  <Badge variant="secondary" className="mr-3">4</Badge>
                  <div>
                    <h4 className="font-medium">Managing Your Library</h4>
                    <p className="text-sm text-muted-foreground">Organize and track your books</p>
                  </div>
                </a>
              </div>
            </CardContent>
          </Card>

          {/* Contact Support */}
          <Card>
            <CardHeader>
              <CardTitle className="text-center">Still Need Help?</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-muted-foreground mb-6">
                Can't find what you're looking for? Our support team is ready to assist you.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a 
                  href="/contact" 
                  className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  Contact Support
                </a>
                <a 
                  href="/faq" 
                  className="inline-flex items-center justify-center rounded-md border border-input bg-background px-6 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  View FAQ
                </a>
              </div>
              
              <div className="mt-8 pt-6 border-t">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                  <div>
                    <h4 className="font-medium mb-2">Email Support</h4>
                    <p className="text-muted-foreground">support@astewai-bookstore.com</p>
                    <p className="text-muted-foreground">Response within 24 hours</p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Phone Support</h4>
                    <p className="text-muted-foreground">+1 (555) 123-4567</p>
                    <p className="text-muted-foreground">Mon-Fri, 9 AM - 6 PM EST</p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Live Chat</h4>
                    <p className="text-muted-foreground">Available on our website</p>
                    <p className="text-muted-foreground">Mon-Fri, 9 AM - 6 PM EST</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}