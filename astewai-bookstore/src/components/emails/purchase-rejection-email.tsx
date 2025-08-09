import { Html, Head, Body, Container, Section, Text, Button, Hr } from '@react-email/components';
import { BaseEmailLayout } from './base-layout';
import { PurchaseItem } from '@/lib/services/email-notifications';

interface PurchaseRejectionEmailProps {
  userName: string;
  purchaseId: string;
  items: PurchaseItem[];
  totalAmount: number;
  purchaseDate: string;
  rejectionReason: string;
}

export function PurchaseRejectionEmail({
  userName,
  purchaseId,
  items,
  totalAmount,
  purchaseDate,
  rejectionReason,
}: PurchaseRejectionEmailProps) {
  return (
    <BaseEmailLayout>
      <Container style={containerStyle}>
        <Section style={headerStyle}>
          <Text style={titleStyle}>Purchase Declined</Text>
          <Text style={subtitleStyle}>Order #{purchaseId}</Text>
        </Section>

        <Section style={contentStyle}>
          <Text style={greetingStyle}>Hi {userName},</Text>
          
          <Text style={messageStyle}>
            We regret to inform you that your purchase request has been declined.
          </Text>

          <Section style={reasonStyle}>
            <Text style={reasonTitleStyle}>Reason for Decline:</Text>
            <Text style={reasonTextStyle}>{rejectionReason}</Text>
          </Section>

          <Hr style={dividerStyle} />

          <Section style={orderDetailsStyle}>
            <Text style={sectionTitleStyle}>Order Details</Text>
            <Text style={detailStyle}>Order ID: {purchaseId}</Text>
            <Text style={detailStyle}>Date: {new Date(purchaseDate).toLocaleDateString()}</Text>
            <Text style={detailStyle}>Total: ${totalAmount.toFixed(2)}</Text>
          </Section>

          <Section style={itemsStyle}>
            <Text style={sectionTitleStyle}>Items:</Text>
            {items.map((item, index) => (
              <div key={index} style={itemStyle}>
                <Text style={itemNameStyle}>{item.title}</Text>
                <Text style={itemDetailsStyle}>
                  {item.type === 'bundle' ? 'Bundle' : 'Book'} • ${item.price.toFixed(2)}
                </Text>
              </div>
            ))}
          </Section>

          <Hr style={dividerStyle} />

          <Text style={messageStyle}>
            If you have questions about this decision or would like to discuss alternative options, 
            please don't hesitate to contact our support team.
          </Text>

          <Section style={buttonContainerStyle}>
            <Button href="mailto:support@astewai-bookstore.com" style={buttonStyle}>
              Contact Support
            </Button>
          </Section>

          <Text style={footerStyle}>
            Thank you for your interest in Astewai Bookstore.
          </Text>
        </Section>
      </Container>
    </BaseEmailLayout>
  );
}

// Styles
const containerStyle = {
  maxWidth: '600px',
  margin: '0 auto',
  padding: '20px',
  fontFamily: 'Arial, sans-serif',
};

const headerStyle = {
  textAlign: 'center' as const,
  marginBottom: '30px',
};

const titleStyle = {
  fontSize: '28px',
  fontWeight: 'bold',
  color: '#dc2626',
  margin: '0 0 10px 0',
};

const subtitleStyle = {
  fontSize: '16px',
  color: '#6b7280',
  margin: '0',
};

const contentStyle = {
  backgroundColor: '#ffffff',
  padding: '30px',
  borderRadius: '8px',
  border: '1px solid #e5e7eb',
};

const greetingStyle = {
  fontSize: '18px',
  fontWeight: 'bold',
  color: '#111827',
  marginBottom: '20px',
};

const messageStyle = {
  fontSize: '16px',
  color: '#374151',
  lineHeight: '1.6',
  marginBottom: '20px',
};

const reasonStyle = {
  backgroundColor: '#fef2f2',
  padding: '20px',
  borderRadius: '6px',
  border: '1px solid #fecaca',
  marginBottom: '20px',
};

const reasonTitleStyle = {
  fontSize: '16px',
  fontWeight: 'bold',
  color: '#dc2626',
  marginBottom: '10px',
};

const reasonTextStyle = {
  fontSize: '16px',
  color: '#7f1d1d',
  lineHeight: '1.5',
};

const dividerStyle = {
  border: 'none',
  borderTop: '1px solid #e5e7eb',
  margin: '30px 0',
};

const orderDetailsStyle = {
  marginBottom: '20px',
};

const sectionTitleStyle = {
  fontSize: '18px',
  fontWeight: 'bold',
  color: '#111827',
  marginBottom: '15px',
};

const detailStyle = {
  fontSize: '14px',
  color: '#6b7280',
  margin: '5px 0',
};

const itemsStyle = {
  marginBottom: '20px',
};

const itemStyle = {
  padding: '10px 0',
  borderBottom: '1px solid #f3f4f6',
};

const itemNameStyle = {
  fontSize: '16px',
  fontWeight: '500',
  color: '#111827',
  margin: '0 0 5px 0',
};

const itemDetailsStyle = {
  fontSize: '14px',
  color: '#6b7280',
  margin: '0',
};

const buttonContainerStyle = {
  textAlign: 'center' as const,
  margin: '30px 0',
};

const buttonStyle = {
  backgroundColor: '#3b82f6',
  color: '#ffffff',
  padding: '12px 24px',
  borderRadius: '6px',
  textDecoration: 'none',
  fontWeight: 'bold',
  display: 'inline-block',
};

const footerStyle = {
  fontSize: '14px',
  color: '#6b7280',
  textAlign: 'center' as const,
  marginTop: '30px',
};