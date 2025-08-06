import {
  Text,
  Heading,
  Button,
  Section,
} from '@react-email/components';
import { BaseEmailLayout } from './base-layout';

interface WelcomeEmailProps {
  userName: string;
  userEmail: string;
}

export function WelcomeEmail({ userName, userEmail }: WelcomeEmailProps) {
  return (
    <BaseEmailLayout previewText={`Welcome to Astewai Bookstore, ${userName}!`}>
      <Heading className="text-2xl font-bold text-gray-900 mb-6">
        Welcome to Astewai Digital Bookstore! 📚
      </Heading>

      <Text className="text-gray-700 text-base mb-4">
        Hi {userName},
      </Text>

      <Text className="text-gray-700 text-base mb-4">
        Welcome to Astewai Digital Bookstore! We're thrilled to have you join our
        community of book lovers. Your account has been successfully created with
        the email address: <strong>{userEmail}</strong>
      </Text>

      <Text className="text-gray-700 text-base mb-6">
        Here's what you can do now:
      </Text>

      <Section className="bg-gray-50 rounded-lg p-4 mb-6">
        <Text className="text-gray-700 text-sm mb-2">
          ✨ <strong>Discover Books:</strong> Browse our extensive collection of digital books
        </Text>
        <Text className="text-gray-700 text-sm mb-2">
          📦 <strong>Explore Bundles:</strong> Get curated book collections at discounted prices
        </Text>
        <Text className="text-gray-700 text-sm mb-2">
          📖 <strong>Build Your Library:</strong> Track your reading progress and manage your collection
        </Text>
        <Text className="text-gray-700 text-sm">
          📝 <strong>Read Our Blog:</strong> Stay updated with book recommendations and reviews
        </Text>
      </Section>

      <Section className="text-center mb-6">
        <Button
          href="https://astewai-bookstore.com/books"
          className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium inline-block text-decoration-none"
        >
          Start Exploring Books
        </Button>
      </Section>

      <Text className="text-gray-700 text-base mb-4">
        If you have any questions or need assistance, don't hesitate to reach out
        to our support team. We're here to help make your reading journey amazing!
      </Text>

      <Text className="text-gray-700 text-base">
        Happy reading! 🎉
        <br />
        The Astewai Bookstore Team
      </Text>
    </BaseEmailLayout>
  );
}