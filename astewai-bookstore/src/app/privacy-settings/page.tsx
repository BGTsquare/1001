import { Metadata } from 'next';
import { PrivacySettings } from '@/components/privacy';
import { generateMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = generateMetadata({
  title: 'Privacy Settings - Manage Your Data & Privacy Preferences',
  description: 'Control your privacy settings, manage data collection preferences, and exercise your data rights including export and deletion.',
  url: '/privacy-settings',
  type: 'website',
});

export default function PrivacySettingsPage() {
  // In a real app, you would get the user email from authentication
  const userEmail = 'user@example.com';

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <PrivacySettings userEmail={userEmail} />
    </div>
  );
}