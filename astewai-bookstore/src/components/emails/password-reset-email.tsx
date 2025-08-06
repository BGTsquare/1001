import {
  Text,
  Heading,
  Button,
  Section,
} from '@react-email/components';
import { BaseEmailLayout } from './base-layout';

interface PasswordResetEmailProps {
  userName: string;
  resetUrl: string;
  expiresIn: string;
}

export function PasswordResetEmail({
  userName,
  resetUrl,
  expiresIn,
}: PasswordResetEmailProps) {
  return (
    <BaseEmailLayout previewText="Reset your Astewai Bookstore password">
      <Heading className="text-2xl font-bold text-gray-900 mb-6">
        Reset Your Password 🔐
      </Heading>

      <Text className="text-gray-700 text-base mb-4">
        Hi {userName},
      </Text>

      <Text className="text-gray-700 text-base mb-6">
        We received a request to reset your password for your Astewai Bookstore
        account. If you made this request, click the button below to create a
        new password.
      </Text>

      <Section className="text-center mb-6">
        <Button
          href={resetUrl}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium inline-block text-decoration-none"
        >
          Reset My Password
        </Button>
      </Section>

      <Section className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <Text className="text-yellow-800 text-base font-medium mb-2">
          ⚠️ Important Security Information
        </Text>
        <Text className="text-yellow-700 text-sm mb-2">
          • This reset link will expire in {expiresIn}
        </Text>
        <Text className="text-yellow-700 text-sm mb-2">
          • The link can only be used once
        </Text>
        <Text className="text-yellow-700 text-sm">
          • If you didn't request this reset, please ignore this email
        </Text>
      </Section>

      <Text className="text-gray-700 text-base mb-4">
        If the button above doesn't work, you can copy and paste this link into
        your browser:
      </Text>

      <Section className="bg-gray-50 rounded-lg p-4 mb-6">
        <Text className="text-sm text-gray-600 break-all">
          {resetUrl}
        </Text>
      </Section>

      <Section className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
        <Text className="text-red-800 text-base font-medium mb-2">
          🚨 Didn't request this?
        </Text>
        <Text className="text-red-700 text-sm mb-2">
          If you didn't request a password reset, your account may be at risk.
          Please:
        </Text>
        <Text className="text-red-700 text-sm mb-1">
          • Ignore this email (the link will expire automatically)
        </Text>
        <Text className="text-red-700 text-sm mb-1">
          • Consider changing your password as a precaution
        </Text>
        <Text className="text-red-700 text-sm">
          • Contact our support team if you're concerned
        </Text>
      </Section>

      <Text className="text-gray-700 text-base mb-4">
        For your security, we recommend using a strong, unique password that
        you don't use for other accounts.
      </Text>

      <Text className="text-gray-700 text-base">
        If you need assistance, please contact our support team.
        <br />
        The Astewai Bookstore Team
      </Text>
    </BaseEmailLayout>
  );
}