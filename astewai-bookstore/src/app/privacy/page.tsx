import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, Eye, Lock, Users, Mail, Cookie } from 'lucide-react';
import { generateMetadata } from '@/lib/seo/metadata';
import { generateBreadcrumbStructuredData } from '@/lib/seo/structured-data';
import { StructuredData } from '@/components/seo/structured-data';

export const metadata = generateMetadata({
  title: 'Privacy Policy - Astewai Digital Bookstore',
  description: 'Learn how Astewai Digital Bookstore collects, uses, and protects your personal information. Our commitment to your privacy and data security.',
  url: '/privacy',
  type: 'website',
  tags: ['privacy', 'data protection', 'GDPR', 'personal information', 'security'],
});

export default function PrivacyPage() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://astewai-bookstore.com';

  const breadcrumbStructuredData = generateBreadcrumbStructuredData([
    { name: 'Home', url: baseUrl },
    { name: 'Privacy Policy', url: `${baseUrl}/privacy` },
  ]);

  return (
    <>
      <StructuredData data={breadcrumbStructuredData} id="privacy-breadcrumb" />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <Shield className="h-12 w-12 text-primary mr-3" />
              <h1 className="text-4xl font-bold">Privacy Policy</h1>
            </div>
            <p className="text-muted-foreground">
              Last updated: January 1, 2024
            </p>
            <Badge variant="outline" className="mt-2">
              GDPR Compliant
            </Badge>
          </div>

          {/* Introduction */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center">
                <Eye className="h-6 w-6 mr-2" />
                Your Privacy Matters
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-lg max-w-none">
              <p>
                At Astewai Digital Bookstore, we are committed to protecting your privacy and 
                ensuring the security of your personal information. This Privacy Policy explains 
                how we collect, use, disclose, and safeguard your information when you use our 
                digital bookstore platform.
              </p>
              <p>
                We believe in transparency and want you to understand exactly how your data is 
                handled. This policy complies with the General Data Protection Regulation (GDPR) 
                and other applicable privacy laws.
              </p>
            </CardContent>
          </Card>

          {/* Quick Overview */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Privacy at a Glance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="flex items-start space-x-3">
                  <Lock className="h-5 w-5 text-primary mt-1" />
                  <div>
                    <h4 className="font-medium">Secure Storage</h4>
                    <p className="text-sm text-muted-foreground">Your data is encrypted and securely stored</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Users className="h-5 w-5 text-primary mt-1" />
                  <div>
                    <h4 className="font-medium">No Selling</h4>
                    <p className="text-sm text-muted-foreground">We never sell your personal information</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Eye className="h-5 w-5 text-primary mt-1" />
                  <div>
                    <h4 className="font-medium">Full Control</h4>
                    <p className="text-sm text-muted-foreground">You control your data and privacy settings</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Table of Contents */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Table of Contents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                <a href="#information-we-collect" className="text-primary hover:underline">1. Information We Collect</a>
                <a href="#how-we-use" className="text-primary hover:underline">2. How We Use Your Information</a>
                <a href="#information-sharing" className="text-primary hover:underline">3. Information Sharing</a>
                <a href="#data-security" className="text-primary hover:underline">4. Data Security</a>
                <a href="#your-rights" className="text-primary hover:underline">5. Your Rights</a>
                <a href="#cookies" className="text-primary hover:underline">6. Cookies and Tracking</a>
                <a href="#data-retention" className="text-primary hover:underline">7. Data Retention</a>
                <a href="#international-transfers" className="text-primary hover:underline">8. International Transfers</a>
                <a href="#children-privacy" className="text-primary hover:underline">9. Children's Privacy</a>
                <a href="#changes" className="text-primary hover:underline">10. Changes to This Policy</a>
                <a href="#contact" className="text-primary hover:underline">11. Contact Us</a>
              </div>
            </CardContent>
          </Card>

          {/* Privacy Sections */}
          <div className="space-y-8">
            <Card id="information-we-collect">
              <CardHeader>
                <CardTitle className="text-xl">1. Information We Collect</CardTitle>
              </CardHeader>
              <CardContent className="prose max-w-none">
                <h4>Personal Information You Provide</h4>
                <ul>
                  <li><strong>Account Information:</strong> Name, email address, password</li>
                  <li><strong>Profile Information:</strong> Display name, avatar, reading preferences</li>
                  <li><strong>Payment Information:</strong> Billing address, payment method details (processed securely)</li>
                  <li><strong>Communication:</strong> Messages you send us, support requests, feedback</li>
                </ul>

                <h4>Information We Collect Automatically</h4>
                <ul>
                  <li><strong>Usage Data:</strong> Pages visited, books viewed, reading progress, time spent</li>
                  <li><strong>Device Information:</strong> Browser type, operating system, IP address</li>
                  <li><strong>Log Data:</strong> Access times, error logs, performance metrics</li>
                  <li><strong>Cookies:</strong> Session data, preferences, analytics information</li>
                </ul>

                <h4>Information from Third Parties</h4>
                <ul>
                  <li><strong>Authentication:</strong> If you sign in with social media accounts</li>
                  <li><strong>Payment Processors:</strong> Transaction confirmations and payment status</li>
                </ul>
              </CardContent>
            </Card>

            <Card id="how-we-use">
              <CardHeader>
                <CardTitle className="text-xl">2. How We Use Your Information</CardTitle>
              </CardHeader>
              <CardContent className="prose max-w-none">
                <h4>Service Provision</h4>
                <ul>
                  <li>Create and manage your account</li>
                  <li>Process purchases and manage your library</li>
                  <li>Provide customer support and respond to inquiries</li>
                  <li>Deliver books and content you've purchased</li>
                </ul>

                <h4>Service Improvement</h4>
                <ul>
                  <li>Analyze usage patterns to improve our platform</li>
                  <li>Develop new features and services</li>
                  <li>Personalize your reading experience</li>
                  <li>Provide book recommendations</li>
                </ul>

                <h4>Communication</h4>
                <ul>
                  <li>Send transactional emails (purchase confirmations, receipts)</li>
                  <li>Notify you about account changes or security issues</li>
                  <li>Send marketing communications (with your consent)</li>
                  <li>Provide customer support</li>
                </ul>

                <h4>Legal and Security</h4>
                <ul>
                  <li>Comply with legal obligations</li>
                  <li>Protect against fraud and abuse</li>
                  <li>Enforce our Terms of Service</li>
                  <li>Maintain platform security</li>
                </ul>
              </CardContent>
            </Card>

            <Card id="information-sharing">
              <CardHeader>
                <CardTitle className="text-xl">3. Information Sharing</CardTitle>
              </CardHeader>
              <CardContent className="prose max-w-none">
                <p><strong>We do not sell your personal information.</strong> We may share your information only in these limited circumstances:</p>

                <h4>Service Providers</h4>
                <ul>
                  <li>Payment processors for transaction handling</li>
                  <li>Email service providers for communications</li>
                  <li>Cloud hosting providers for data storage</li>
                  <li>Analytics providers for usage insights</li>
                </ul>

                <h4>Legal Requirements</h4>
                <ul>
                  <li>When required by law or legal process</li>
                  <li>To protect our rights or property</li>
                  <li>To prevent fraud or abuse</li>
                  <li>In emergency situations to protect safety</li>
                </ul>

                <h4>Business Transfers</h4>
                <p>
                  In the event of a merger, acquisition, or sale of assets, your information 
                  may be transferred as part of that transaction.
                </p>
              </CardContent>
            </Card>

            <Card id="data-security">
              <CardHeader>
                <CardTitle className="text-xl flex items-center">
                  <Lock className="h-5 w-5 mr-2" />
                  4. Data Security
                </CardTitle>
              </CardHeader>
              <CardContent className="prose max-w-none">
                <p>We implement comprehensive security measures to protect your information:</p>

                <h4>Technical Safeguards</h4>
                <ul>
                  <li>Encryption of data in transit and at rest</li>
                  <li>Secure authentication and access controls</li>
                  <li>Regular security audits and monitoring</li>
                  <li>Secure hosting infrastructure</li>
                </ul>

                <h4>Administrative Safeguards</h4>
                <ul>
                  <li>Limited access to personal information</li>
                  <li>Employee training on data protection</li>
                  <li>Regular security policy updates</li>
                  <li>Incident response procedures</li>
                </ul>

                <h4>Physical Safeguards</h4>
                <ul>
                  <li>Secure data centers with restricted access</li>
                  <li>Environmental controls and monitoring</li>
                  <li>Backup and disaster recovery systems</li>
                </ul>
              </CardContent>
            </Card>

            <Card id="your-rights">
              <CardHeader>
                <CardTitle className="text-xl">5. Your Rights</CardTitle>
              </CardHeader>
              <CardContent className="prose max-w-none">
                <p>Under GDPR and other privacy laws, you have the following rights:</p>

                <h4>Access and Portability</h4>
                <ul>
                  <li><strong>Right to Access:</strong> Request a copy of your personal data</li>
                  <li><strong>Right to Portability:</strong> Receive your data in a structured format</li>
                </ul>

                <h4>Correction and Deletion</h4>
                <ul>
                  <li><strong>Right to Rectification:</strong> Correct inaccurate personal data</li>
                  <li><strong>Right to Erasure:</strong> Request deletion of your personal data</li>
                </ul>

                <h4>Processing Control</h4>
                <ul>
                  <li><strong>Right to Restrict:</strong> Limit how we process your data</li>
                  <li><strong>Right to Object:</strong> Object to certain types of processing</li>
                  <li><strong>Right to Withdraw Consent:</strong> Withdraw consent for data processing</li>
                </ul>

                <p>
                  To exercise these rights, contact us at privacy@astewai-bookstore.com. 
                  We will respond within 30 days.
                </p>
              </CardContent>
            </Card>

            <Card id="cookies">
              <CardHeader>
                <CardTitle className="text-xl flex items-center">
                  <Cookie className="h-5 w-5 mr-2" />
                  6. Cookies and Tracking
                </CardTitle>
              </CardHeader>
              <CardContent className="prose max-w-none">
                <h4>Types of Cookies We Use</h4>
                <ul>
                  <li><strong>Essential Cookies:</strong> Required for basic site functionality</li>
                  <li><strong>Performance Cookies:</strong> Help us understand how you use our site</li>
                  <li><strong>Functional Cookies:</strong> Remember your preferences and settings</li>
                  <li><strong>Marketing Cookies:</strong> Used for targeted advertising (with consent)</li>
                </ul>

                <h4>Managing Cookies</h4>
                <p>
                  You can control cookies through your browser settings. Note that disabling 
                  certain cookies may affect site functionality.
                </p>

                <h4>Third-Party Tracking</h4>
                <p>
                  We use analytics services like Google Analytics to understand site usage. 
                  These services may use cookies and similar technologies.
                </p>
              </CardContent>
            </Card>

            <Card id="data-retention">
              <CardHeader>
                <CardTitle className="text-xl">7. Data Retention</CardTitle>
              </CardHeader>
              <CardContent className="prose max-w-none">
                <p>We retain your information for as long as necessary to:</p>
                <ul>
                  <li>Provide our services to you</li>
                  <li>Comply with legal obligations</li>
                  <li>Resolve disputes and enforce agreements</li>
                  <li>Maintain security and prevent fraud</li>
                </ul>

                <h4>Retention Periods</h4>
                <ul>
                  <li><strong>Account Data:</strong> Until account deletion + 30 days</li>
                  <li><strong>Purchase Records:</strong> 7 years for tax and legal compliance</li>
                  <li><strong>Support Communications:</strong> 3 years</li>
                  <li><strong>Analytics Data:</strong> 26 months (anonymized)</li>
                </ul>
              </CardContent>
            </Card>

            <Card id="international-transfers">
              <CardHeader>
                <CardTitle className="text-xl">8. International Transfers</CardTitle>
              </CardHeader>
              <CardContent className="prose max-w-none">
                <p>
                  Your information may be transferred to and processed in countries other than 
                  your own. We ensure appropriate safeguards are in place:
                </p>
                <ul>
                  <li>Adequacy decisions by the European Commission</li>
                  <li>Standard Contractual Clauses (SCCs)</li>
                  <li>Binding Corporate Rules</li>
                  <li>Certification schemes and codes of conduct</li>
                </ul>
              </CardContent>
            </Card>

            <Card id="children-privacy">
              <CardHeader>
                <CardTitle className="text-xl">9. Children's Privacy</CardTitle>
              </CardHeader>
              <CardContent className="prose max-w-none">
                <p>
                  Our service is not intended for children under 13. We do not knowingly 
                  collect personal information from children under 13. If you are a parent 
                  or guardian and believe your child has provided us with personal information, 
                  please contact us.
                </p>
                <p>
                  For users between 13 and 18, we recommend parental guidance and supervision 
                  when using our service.
                </p>
              </CardContent>
            </Card>

            <Card id="changes">
              <CardHeader>
                <CardTitle className="text-xl">10. Changes to This Policy</CardTitle>
              </CardHeader>
              <CardContent className="prose max-w-none">
                <p>
                  We may update this Privacy Policy from time to time. We will notify you of 
                  any material changes by:
                </p>
                <ul>
                  <li>Posting the updated policy on our website</li>
                  <li>Sending an email notification</li>
                  <li>Displaying a prominent notice on our platform</li>
                </ul>
                <p>
                  Your continued use of our service after changes become effective constitutes 
                  acceptance of the updated policy.
                </p>
              </CardContent>
            </Card>

            <Card id="contact">
              <CardHeader>
                <CardTitle className="text-xl flex items-center">
                  <Mail className="h-5 w-5 mr-2" />
                  11. Contact Us
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  If you have any questions about this Privacy Policy or our data practices, 
                  please contact us:
                </p>
                <div className="space-y-2">
                  <p><strong>Privacy Officer:</strong> privacy@astewai-bookstore.com</p>
                  <p><strong>General Contact:</strong> support@astewai-bookstore.com</p>
                  <p><strong>Address:</strong> 123 Digital Library Street, Booktown, BT 12345</p>
                  <p><strong>Phone:</strong> +1 (555) 123-4567</p>
                </div>
                
                <div className="mt-6 p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2">Data Protection Officer</h4>
                  <p className="text-sm text-muted-foreground">
                    For GDPR-related inquiries, you can contact our Data Protection Officer at 
                    dpo@astewai-bookstore.com
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}