import {
  Text,
  Heading,
  Button,
  Section,
} from '@react-email/components';
import { BaseEmailLayout } from './base-layout';

interface SecurityNotificationEmailProps {
  userName: string;
  eventType: 'login' | 'password_change' | 'email_change' | 'suspicious_activity';
  eventDetails: {
    timestamp: string;
    ipAddress?: string;
    location?: string;
    device?: string;
  };
}

export function SecurityNotificationEmail({
  userName,
  eventType,
  eventDetails,
}: SecurityNotificationEmailProps) {
  const getEventTitle = () => {
    switch (eventType) {
      case 'login':
        return 'New Login to Your Account';
      case 'password_change':
        return 'Password Changed Successfully';
      case 'email_change':
        return 'Email Address Updated';
      case 'suspicious_activity':
        return 'Suspicious Activity Detected';
      default:
        return 'Security Notification';
    }
  };

  const getEventIcon = () => {
    switch (eventType) {
      case 'login':
        return '🔐';
      case 'password_change':
        return '🔑';
      case 'email_change':
        return '📧';
      case 'suspicious_activity':
        return '⚠️';
      default:
        return '🔒';
    }
  };

  const getEventDescription = () => {
    switch (eventType) {
      case 'login':
        return 'We detected a new login to your Astewai Bookstore account.';
      case 'password_change':
        return 'Your account password has been successfully changed.';
      case 'email_change':
        return 'Your account email address has been updated.';
      case 'suspicious_activity':
        return 'We detected unusual activity on your account that may require your attention.';
      default:
        return 'A security event occurred on your account.';
    }
  };

  const isHighRisk = eventType === 'suspicious_activity';

  return (
    <BaseEmailLayout previewText={`Security Alert: ${getEventTitle()}`}>
      <Heading className="text-2xl font-bold text-gray-900 mb-6">
        {getEventIcon()} {getEventTitle()}
      </Heading>

      <Text className="text-gray-700 text-base mb-4">
        Hi {userName},
      </Text>

      <Text className="text-gray-700 text-base mb-6">
        {getEventDescription()}
      </Text>

      {/* Event Details */}
      <Section className={`rounded-lg p-4 mb-6 ${
        isHighRisk 
          ? 'bg-red-50 border border-red-200' 
          : 'bg-blue-50 border border-blue-200'
      }`}>
        <Text className={`text-base font-medium mb-3 ${
          isHighRisk ? 'text-red-800' : 'text-blue-800'
        }`}>
          Event Details:
        </Text>
        
        <Text className={`text-sm mb-2 ${
          isHighRisk ? 'text-red-700' : 'text-blue-700'
        }`}>
          <strong>Time:</strong> {eventDetails.timestamp}
        </Text>
        
        {eventDetails.ipAddress && (
          <Text className={`text-sm mb-2 ${
            isHighRisk ? 'text-red-700' : 'text-blue-700'
          }`}>
            <strong>IP Address:</strong> {eventDetails.ipAddress}
          </Text>
        )}
        
        {eventDetails.location && (
          <Text className={`text-sm mb-2 ${
            isHighRisk ? 'text-red-700' : 'text-blue-700'
          }`}>
            <strong>Location:</strong> {eventDetails.location}
          </Text>
        )}
        
        {eventDetails.device && (
          <Text className={`text-sm ${
            isHighRisk ? 'text-red-700' : 'text-blue-700'
          }`}>
            <strong>Device:</strong> {eventDetails.device}
          </Text>
        )}
      </Section>

      {/* Action Required for High Risk Events */}
      {isHighRisk && (
        <Section className="bg-red-100 border border-red-300 rounded-lg p-4 mb-6">
          <Text className="text-red-800 text-base font-medium mb-3">
            🚨 Immediate Action Required
          </Text>
          <Text className="text-red-700 text-sm mb-2">
            • Review your account activity immediately
          </Text>
          <Text className="text-red-700 text-sm mb-2">
            • Change your password if you don't recognize this activity
          </Text>
          <Text className="text-red-700 text-sm mb-2">
            • Enable two-factor authentication for added security
          </Text>
          <Text className="text-red-700 text-sm">
            • Contact support if you need assistance
          </Text>
        </Section>
      )}

      {/* Normal Security Advice */}
      {!isHighRisk && (
        <Section className="bg-gray-50 rounded-lg p-4 mb-6">
          <Text className="text-gray-800 text-base font-medium mb-3">
            🛡️ Security Best Practices:
          </Text>
          <Text className="text-gray-700 text-sm mb-2">
            • Always log out from shared or public devices
          </Text>
          <Text className="text-gray-700 text-sm mb-2">
            • Use a strong, unique password for your account
          </Text>
          <Text className="text-gray-700 text-sm mb-2">
            • Keep your browser and devices updated
          </Text>
          <Text className="text-gray-700 text-sm">
            • Be cautious of phishing emails and suspicious links
          </Text>
        </Section>
      )}

      {/* Action Buttons */}
      <Section className="text-center mb-6">
        <Button
          href="https://astewai-bookstore.com/profile/security"
          className={`px-6 py-3 rounded-lg font-medium inline-block text-decoration-none mr-4 ${
            isHighRisk 
              ? 'bg-red-600 text-white' 
              : 'bg-blue-600 text-white'
          }`}
        >
          {isHighRisk ? 'Secure My Account' : 'Review Security Settings'}
        </Button>
        
        {isHighRisk && (
          <Button
            href="https://astewai-bookstore.com/auth/reset-password"
            className="bg-gray-600 text-white px-6 py-3 rounded-lg font-medium inline-block text-decoration-none"
          >
            Change Password
          </Button>
        )}
      </Section>

      <Text className="text-gray-700 text-base mb-4">
        {eventType === 'login' && !isHighRisk && (
          "If this was you, no action is needed. If you don't recognize this activity, please secure your account immediately."
        )}
        {eventType === 'password_change' && (
          "If you didn't make this change, please contact our support team immediately."
        )}
        {eventType === 'email_change' && (
          "If you didn't make this change, please contact our support team immediately."
        )}
        {isHighRisk && (
          "Please take immediate action to secure your account. If you need assistance, our support team is available 24/7."
        )}
      </Text>

      <Text className="text-gray-700 text-base">
        Stay safe online!
        <br />
        The Astewai Bookstore Security Team
      </Text>
    </BaseEmailLayout>
  );
}