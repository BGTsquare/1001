import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Img,
  Text,
  Link,
  Hr,
  Tailwind,
} from '@react-email/components';
import { ReactNode } from 'react';

interface BaseEmailLayoutProps {
  children: ReactNode;
  previewText?: string;
}

export function BaseEmailLayout({
  children,
  previewText,
}: BaseEmailLayoutProps) {
  return (
    <Html>
      <Head />
      <Tailwind>
        <Body className="bg-gray-50 font-sans">
          {previewText && (
            <Text className="hidden text-transparent text-xs">
              {previewText}
            </Text>
          )}
          
          <Container className="mx-auto py-8 px-4 max-w-2xl">
            {/* Header */}
            <Section className="bg-white rounded-t-lg p-6 border-b border-gray-200">
              <Img
                src="https://astewai-bookstore.com/logo.png"
                alt="Astewai Bookstore"
                width="150"
                height="40"
                className="mx-auto"
              />
            </Section>

            {/* Content */}
            <Section className="bg-white p-6">
              {children}
            </Section>

            {/* Footer */}
            <Section className="bg-gray-100 rounded-b-lg p-6 text-center">
              <Text className="text-gray-600 text-sm mb-4">
                Thank you for choosing Astewai Digital Bookstore
              </Text>
              
              <Hr className="border-gray-300 my-4" />
              
              <Text className="text-gray-500 text-xs">
                © 2025 Astewai Digital Bookstore. All rights reserved.
              </Text>
              
              <Text className="text-gray-500 text-xs mt-2">
                <Link
                  href="https://astewai-bookstore.com/contact"
                  className="text-blue-600 underline"
                >
                  Contact Support
                </Link>
                {' | '}
                <Link
                  href="https://astewai-bookstore.com/privacy"
                  className="text-blue-600 underline"
                >
                  Privacy Policy
                </Link>
                {' | '}
                <Link
                  href="https://astewai-bookstore.com/terms"
                  className="text-blue-600 underline"
                >
                  Terms of Service
                </Link>
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}