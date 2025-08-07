import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  HelpCircle, 
  BookOpen, 
  CreditCard, 
  User, 
  Settings, 
  Shield, 
  Search,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { generateMetadata } from '@/lib/seo/metadata';
import { generateBreadcrumbStructuredData } from '@/lib/seo/structured-data';
import { StructuredData } from '@/components/seo/structured-data';

export const metadata = generateMetadata({
  title: 'Frequently Asked Questions - Astewai Digital Bookstore',
  description: 'Find answers to common questions about Astewai Digital Bookstore. Get help with accounts, purchases, reading, and technical issues.',
  url: '/faq',
  type: 'website',
  tags: ['FAQ', 'help', 'support', 'questions', 'answers', 'troubleshooting'],
});

export default function FAQPage() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://astewai-bookstore.com';

  const breadcrumbStructuredData = generateBreadcrumbStructuredData([
    { name: 'Home', url: baseUrl },
    { name: 'FAQ', url: `${baseUrl}/faq` },
  ]);

  const faqCategories = [
    {
      id: 'general',
      title: 'General Questions',
      icon: HelpCircle,
      questions: [
        {
          question: 'What is Astewai Digital Bookstore?',
          answer: 'Astewai Digital Bookstore is a modern platform for discovering, purchasing, and reading digital books. We offer individual books and curated bundles at discounted prices, with features like personal library management and reading progress tracking.'
        },
        {
          question: 'How do I get started?',
          answer: 'Simply create a free account by clicking the "Register" button. You can then browse our collection, add free books to your library, or purchase premium content. All your books will be available in your personal library.'
        },
        {
          question: 'Is there a mobile app?',
          answer: 'Currently, we offer a responsive web platform that works great on mobile devices. We\'re working on dedicated mobile apps for iOS and Android, which will be available soon.'
        },
        {
          question: 'What file formats do you support?',
          answer: 'We primarily use web-based reading formats that work across all devices. Our books are optimized for online reading with features like adjustable font sizes, themes, and progress tracking.'
        }
      ]
    },
    {
      id: 'account',
      title: 'Account & Profile',
      icon: User,
      questions: [
        {
          question: 'How do I create an account?',
          answer: 'Click "Register" in the top navigation, enter your email and password, and verify your email address. Your account will be created automatically with a default profile.'
        },
        {
          question: 'I forgot my password. How do I reset it?',
          answer: 'Click "Forgot Password" on the login page, enter your email address, and we\'ll send you a reset link. Follow the instructions in the email to create a new password.'
        },
        {
          question: 'How do I update my profile information?',
          answer: 'Go to your Profile page from the user menu. You can update your display name, avatar, and reading preferences. Changes are saved automatically.'
        },
        {
          question: 'Can I delete my account?',
          answer: 'Yes, you can request account deletion by contacting our support team. Please note that this will permanently remove your account and library access.'
        }
      ]
    },
    {
      id: 'books',
      title: 'Books & Reading',
      icon: BookOpen,
      questions: [
        {
          question: 'How do I find books I\'m interested in?',
          answer: 'Use our search bar to find specific titles or authors, browse by categories, or check out our curated bundles. We also provide personalized recommendations based on your reading history.'
        },
        {
          question: 'What\'s the difference between free and paid books?',
          answer: 'Free books can be added directly to your library, while paid books require purchase approval. Both types offer the same reading experience with progress tracking and bookmarks.'
        },
        {
          question: 'How does the reading interface work?',
          answer: 'Our reader offers adjustable font sizes, light/dark themes, and automatic progress saving. Your reading position is synchronized across devices, so you can continue where you left off.'
        },
        {
          question: 'Can I read offline?',
          answer: 'Currently, our books require an internet connection. We\'re working on offline reading capabilities for future releases.'
        },
        {
          question: 'How do I track my reading progress?',
          answer: 'Progress is tracked automatically as you read. You can view your progress on the library page, where books are organized by status: All, In Progress, and Completed.'
        }
      ]
    },
    {
      id: 'bundles',
      title: 'Bundles & Collections',
      icon: BookOpen,
      questions: [
        {
          question: 'What are book bundles?',
          answer: 'Bundles are curated collections of related books offered at discounted prices. They\'re perfect for exploring new genres or building your library around specific themes.'
        },
        {
          question: 'How much can I save with bundles?',
          answer: 'Bundle savings vary, but you typically save 20-40% compared to purchasing books individually. The exact savings are displayed on each bundle page.'
        },
        {
          question: 'Can I purchase individual books from a bundle?',
          answer: 'Yes, all books in bundles are also available for individual purchase. However, you\'ll get better value by purchasing the complete bundle.'
        },
        {
          question: 'What happens if I already own some books in a bundle?',
          answer: 'Currently, bundle pricing doesn\'t adjust for books you already own. We recommend checking your library before purchasing bundles to avoid duplicates.'
        }
      ]
    },
    {
      id: 'payments',
      title: 'Payments & Purchases',
      icon: CreditCard,
      questions: [
        {
          question: 'How does the payment process work?',
          answer: 'We use a manual approval system for all purchases. After you submit a purchase request, our admin team reviews and approves it before processing payment. You\'ll receive notifications about the status.'
        },
        {
          question: 'What payment methods do you accept?',
          answer: 'We accept major credit cards, debit cards, and digital payment methods. Payment is processed securely through our payment partners after admin approval.'
        },
        {
          question: 'How long does purchase approval take?',
          answer: 'Most purchase requests are reviewed within 24-48 hours during business days. You\'ll receive email notifications when your request is approved or if we need additional information.'
        },
        {
          question: 'Can I cancel a purchase request?',
          answer: 'Yes, you can cancel pending purchase requests from your Purchase Requests page before they\'re approved. Once approved and payment is processed, cancellations follow our refund policy.'
        },
        {
          question: 'What is your refund policy?',
          answer: 'Due to the digital nature of our products, all sales are final. However, we may consider refunds for technical issues or billing errors on a case-by-case basis.'
        }
      ]
    },
    {
      id: 'technical',
      title: 'Technical Support',
      icon: Settings,
      questions: [
        {
          question: 'The website is loading slowly. What should I do?',
          answer: 'Try refreshing the page, clearing your browser cache, or switching to a different browser. If problems persist, check your internet connection or contact our support team.'
        },
        {
          question: 'I can\'t log in to my account.',
          answer: 'Ensure you\'re using the correct email and password. Try resetting your password if needed. Clear your browser cookies and try again. Contact support if issues continue.'
        },
        {
          question: 'Books aren\'t loading in the reader.',
          answer: 'This is usually a connectivity issue. Check your internet connection, refresh the page, and try again. Some browser extensions may also interfere with the reader.'
        },
        {
          question: 'My reading progress isn\'t saving.',
          answer: 'Ensure you\'re logged in and have a stable internet connection. Progress is saved automatically, but you can manually save by navigating away from the reader and returning.'
        },
        {
          question: 'Which browsers do you support?',
          answer: 'We support all modern browsers including Chrome, Firefox, Safari, and Edge. For the best experience, please use the latest version of your preferred browser.'
        }
      ]
    },
    {
      id: 'privacy',
      title: 'Privacy & Security',
      icon: Shield,
      questions: [
        {
          question: 'How do you protect my personal information?',
          answer: 'We use industry-standard encryption and security measures to protect your data. We never sell your personal information and only share it with trusted service providers as outlined in our Privacy Policy.'
        },
        {
          question: 'What information do you collect?',
          answer: 'We collect information you provide (account details, preferences) and usage data (reading progress, browsing patterns) to improve our service. See our Privacy Policy for complete details.'
        },
        {
          question: 'Can I download my data?',
          answer: 'Yes, you can request a copy of your personal data by contacting our support team. We\'ll provide your information in a structured, machine-readable format.'
        },
        {
          question: 'How do I control my privacy settings?',
          answer: 'Visit your Profile page to manage privacy preferences. You can control email notifications, data sharing preferences, and other privacy-related settings.'
        }
      ]
    }
  ];

  return (
    <>
      <StructuredData data={breadcrumbStructuredData} id="faq-breadcrumb" />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <HelpCircle className="h-12 w-12 text-primary mr-3" />
              <h1 className="text-4xl font-bold">Frequently Asked Questions</h1>
            </div>
            <p className="text-muted-foreground text-lg">
              Find answers to common questions about using Astewai Digital Bookstore
            </p>
          </div>

          {/* Search */}
          <Card className="mb-8">
            <CardContent className="p-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search for answers..."
                  className="pl-10"
                />
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Can't find what you're looking for? <a href="/contact" className="text-primary hover:underline">Contact our support team</a>
              </p>
            </CardContent>
          </Card>

          {/* Quick Links */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            {faqCategories.map((category) => (
              <a
                key={category.id}
                href={`#${category.id}`}
                className="flex flex-col items-center p-4 rounded-lg border hover:bg-accent transition-colors"
              >
                <category.icon className="h-6 w-6 text-primary mb-2" />
                <span className="text-sm font-medium text-center">{category.title}</span>
              </a>
            ))}
          </div>

          {/* FAQ Categories */}
          <div className="space-y-8">
            {faqCategories.map((category) => (
              <Card key={category.id} id={category.id}>
                <CardHeader>
                  <CardTitle className="text-2xl flex items-center">
                    <category.icon className="h-6 w-6 mr-3 text-primary" />
                    {category.title}
                    <Badge variant="secondary" className="ml-3">
                      {category.questions.length} questions
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {category.questions.map((faq, index) => (
                      <details key={index} className="group">
                        <summary className="flex items-center justify-between cursor-pointer p-4 rounded-lg border hover:bg-accent transition-colors">
                          <span className="font-medium">{faq.question}</span>
                          <ChevronDown className="h-4 w-4 text-muted-foreground group-open:rotate-180 transition-transform" />
                        </summary>
                        <div className="mt-2 p-4 text-muted-foreground border-l-2 border-primary/20 ml-4">
                          <p>{faq.answer}</p>
                        </div>
                      </details>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Still Need Help */}
          <Card className="mt-12">
            <CardHeader>
              <CardTitle className="text-center">Still Need Help?</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-muted-foreground mb-6">
                Can't find the answer you're looking for? Our support team is here to help.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a 
                  href="/contact" 
                  className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  Contact Support
                </a>
                <a 
                  href="mailto:support@astewai-bookstore.com" 
                  className="inline-flex items-center justify-center rounded-md border border-input bg-background px-6 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  Email Us
                </a>
              </div>
              
              <div className="mt-8 pt-6 border-t">
                <h3 className="font-medium mb-4">Other Ways to Get Help</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <h4 className="font-medium">Email Support</h4>
                    <p className="text-muted-foreground">support@astewai-bookstore.com</p>
                    <p className="text-muted-foreground">Response within 24 hours</p>
                  </div>
                  <div>
                    <h4 className="font-medium">Phone Support</h4>
                    <p className="text-muted-foreground">+1 (555) 123-4567</p>
                    <p className="text-muted-foreground">Mon-Fri, 9 AM - 6 PM EST</p>
                  </div>
                  <div>
                    <h4 className="font-medium">Live Chat</h4>
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