"use client";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// ...existing code...
import { Badge } from '@/components/ui/badge';
import { generateMetadata } from '@/lib/seo/metadata';
import { generateBreadcrumbStructuredData } from '@/lib/seo/structured-data';
import { StructuredData } from '@/components/seo/structured-data';
import { TermsContentRenderer } from '@/components/legal/terms-content-renderer';

// Component interfaces
interface TermsHeaderProps {
  lastUpdated: string;
  version: string;
}

interface TableOfContentsItem {
  id: string;
  title: string;
}

interface TableOfContentsProps {
  items: readonly TableOfContentsItem[];
}

interface ContactInfo {
  email: string;
  address: string;
  phone: string;
}

interface ContactInformationProps {
  contactInfo: ContactInfo;
}

// Extracted components for better maintainability
function TermsHeader({ lastUpdated, version }: TermsHeaderProps) {
  return (
    <div className="text-center mb-8">
      <h1 className="text-4xl font-bold mb-4">Terms of Service</h1>
      <p className="text-muted-foreground">
        Last updated: {lastUpdated}
      </p>
      <Badge variant="outline" className="mt-2">
        Version {version}
      </Badge>
    </div>
  );
}

function TableOfContents({ items }: TableOfContentsProps) {
  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>Table of Contents</CardTitle>
      </CardHeader>
      <CardContent>
        <nav aria-label="Terms of Service sections">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
            {items.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className="text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded p-1 transition-colors"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById(item.id)?.scrollIntoView({ 
                    behavior: 'smooth',
                    block: 'start'
                  });
                }}
              >
                {item.title}
              </a>
            ))}
          </div>
        </nav>
      </CardContent>
    </Card>
  );
}

function ContactInformation({ contactInfo }: ContactInformationProps) {
  return (
    <Card className="mt-12">
      <CardHeader>
        <CardTitle>Contact Information</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">
          If you have any questions about these Terms of Service, please contact us:
        </p>
        <div className="mt-4 space-y-2">
          <p><strong>Email:</strong> {contactInfo.email}</p>
          <p><strong>Address:</strong> {contactInfo.address}</p>
          <p><strong>Phone:</strong> {contactInfo.phone}</p>
        </div>
      </CardContent>
    </Card>
  );
}

// Remove metadata export from client component. Metadata is now in metadata.ts

// Constants for better maintainability
const TERMS_VERSION = '1.0';
const LAST_UPDATED = 'January 1, 2024';
const CONTACT_INFO = {
  email: 'legal@astewai-bookstore.com',
  address: '123 Digital Library Street, Booktown, BT 12345',
  phone: '+1 (555) 123-4567',
} as const;

// Table of contents for easier maintenance
const TABLE_OF_CONTENTS = [
  { id: 'acceptance', title: '1. Acceptance of Terms' },
  { id: 'accounts', title: '2. User Accounts' },
  { id: 'content', title: '3. Content and Services' },
  { id: 'purchases', title: '4. Purchases and Payments' },
  { id: 'intellectual', title: '5. Intellectual Property' },
  { id: 'conduct', title: '6. User Conduct' },
  { id: 'privacy', title: '7. Privacy' },
  { id: 'termination', title: '8. Termination' },
  { id: 'disclaimers', title: '9. Disclaimers' },
  { id: 'limitation', title: '10. Limitation of Liability' },
  { id: 'governing', title: '11. Governing Law' },
  { id: 'changes', title: '12. Changes to Terms' },
] as const;

export default function TermsPage() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://astewai-bookstore.com';

  const breadcrumbStructuredData = generateBreadcrumbStructuredData([
    { name: 'Home', url: baseUrl },
    { name: 'Terms of Service', url: `${baseUrl}/terms` },
  ]);

  return (
    <>
      <StructuredData data={breadcrumbStructuredData} id="terms-breadcrumb" />
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-primary text-primary-foreground px-4 py-2 rounded z-50"
      >
        Skip to main content
      </a>
      <div className="container mx-auto px-4 py-8 print:px-0 print:py-4">
        <div className="max-w-4xl mx-auto" id="main-content">
          {/* Header */}
          <TermsHeader lastUpdated={LAST_UPDATED} version={TERMS_VERSION} />

          {/* Introduction */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-2xl">Welcome to Astewai Digital Bookstore</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-lg max-w-none">
              <p>
                These Terms of Service ("Terms") govern your use of the Astewai Digital Bookstore 
                platform ("Service") operated by Astewai Digital Bookstore ("us", "we", or "our").
              </p>
              <p>
                By accessing or using our Service, you agree to be bound by these Terms. If you 
                disagree with any part of these terms, then you may not access the Service.
              </p>
            </CardContent>
          </Card>

          {/* Table of Contents */}
          <TableOfContents items={TABLE_OF_CONTENTS} />

          {/* Terms Sections */}
          <TermsContentRenderer />

          {/* Contact Information */}
          <ContactInformation contactInfo={CONTACT_INFO} />
        </div>
      </div>
    </>
  );
}