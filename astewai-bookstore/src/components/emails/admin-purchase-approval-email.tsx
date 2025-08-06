import {
  Text,
  Heading,
  Button,
  Section,
  Row,
  Column,
} from '@react-email/components';
import { BaseEmailLayout } from './base-layout';

interface PurchaseItem {
  id: string;
  title: string;
  type: 'book' | 'bundle';
  price: number;
  quantity: number;
}

interface AdminPurchaseApprovalEmailProps {
  purchaseId: string;
  customerName: string;
  customerEmail: string;
  items: PurchaseItem[];
  totalAmount: number;
  purchaseDate: string;
  paymentMethod?: string;
}

export function AdminPurchaseApprovalEmail({
  purchaseId,
  customerName,
  customerEmail,
  items,
  totalAmount,
  purchaseDate,
  paymentMethod = 'Credit Card',
}: AdminPurchaseApprovalEmailProps) {
  const formatPrice = (price: number) => `$${price.toFixed(2)}`;

  return (
    <BaseEmailLayout previewText={`New Purchase Awaiting Approval - Order #${purchaseId}`}>
      <Heading className="text-2xl font-bold text-gray-900 mb-6">
        🔔 New Purchase Awaiting Approval
      </Heading>

      <Text className="text-gray-700 text-base mb-6">
        A new purchase has been submitted and requires admin approval before
        the customer can access their items.
      </Text>

      {/* Purchase Overview */}
      <Section className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
        <Row>
          <Column>
            <Text className="text-sm text-orange-700 mb-1">Order Number</Text>
            <Text className="text-base font-semibold text-orange-900">
              #{purchaseId}
            </Text>
          </Column>
          <Column>
            <Text className="text-sm text-orange-700 mb-1">Purchase Date</Text>
            <Text className="text-base font-semibold text-orange-900">
              {purchaseDate}
            </Text>
          </Column>
        </Row>
        <Row className="mt-4">
          <Column>
            <Text className="text-sm text-orange-700 mb-1">Total Amount</Text>
            <Text className="text-lg font-bold text-orange-900">
              {formatPrice(totalAmount)}
            </Text>
          </Column>
          <Column>
            <Text className="text-sm text-orange-700 mb-1">Payment Method</Text>
            <Text className="text-base font-semibold text-orange-900">
              {paymentMethod}
            </Text>
          </Column>
        </Row>
      </Section>

      {/* Customer Information */}
      <Section className="mb-6">
        <Heading className="text-lg font-semibold text-gray-900 mb-4">
          Customer Information
        </Heading>
        
        <Section className="bg-gray-50 rounded-lg p-4">
          <Row>
            <Column>
              <Text className="text-sm text-gray-600 mb-1">Customer Name</Text>
              <Text className="text-base font-medium text-gray-900">
                {customerName}
              </Text>
            </Column>
            <Column>
              <Text className="text-sm text-gray-600 mb-1">Email Address</Text>
              <Text className="text-base font-medium text-gray-900">
                {customerEmail}
              </Text>
            </Column>
          </Row>
        </Section>
      </Section>

      {/* Items for Approval */}
      <Section className="mb-6">
        <Heading className="text-lg font-semibold text-gray-900 mb-4">
          Items for Approval
        </Heading>
        
        {items.map((item) => (
          <Section key={item.id} className="border border-gray-200 rounded-lg p-4 mb-3">
            <Row>
              <Column className="w-3/4">
                <Text className="text-base font-medium text-gray-900 mb-1">
                  {item.title}
                </Text>
                <Text className="text-sm text-gray-600">
                  {item.type === 'bundle' ? 'Book Bundle' : 'Digital Book'} • 
                  Quantity: {item.quantity} • 
                  Unit Price: {formatPrice(item.price)}
                </Text>
              </Column>
              <Column className="w-1/4 text-right">
                <Text className="text-base font-semibold text-gray-900">
                  {formatPrice(item.price * item.quantity)}
                </Text>
              </Column>
            </Row>
          </Section>
        ))}

        {/* Total */}
        <Section className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <Row>
            <Column className="w-3/4">
              <Text className="text-lg font-semibold text-gray-900">
                Total Amount
              </Text>
            </Column>
            <Column className="w-1/4 text-right">
              <Text className="text-lg font-bold text-blue-600">
                {formatPrice(totalAmount)}
              </Text>
            </Column>
          </Row>
        </Section>
      </Section>

      {/* Action Buttons */}
      <Section className="text-center mb-6">
        <Button
          href={`https://astewai-bookstore.com/admin/purchases/${purchaseId}?action=approve`}
          className="bg-green-600 text-white px-6 py-3 rounded-lg font-medium inline-block text-decoration-none mr-4"
        >
          ✅ Approve Purchase
        </Button>
        
        <Button
          href={`https://astewai-bookstore.com/admin/purchases/${purchaseId}?action=reject`}
          className="bg-red-600 text-white px-6 py-3 rounded-lg font-medium inline-block text-decoration-none mr-4"
        >
          ❌ Reject Purchase
        </Button>
        
        <Button
          href={`https://astewai-bookstore.com/admin/purchases/${purchaseId}`}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium inline-block text-decoration-none"
        >
          📋 View Details
        </Button>
      </Section>

      {/* Admin Guidelines */}
      <Section className="bg-gray-50 rounded-lg p-4 mb-6">
        <Text className="text-gray-800 text-base font-medium mb-3">
          📋 Approval Guidelines:
        </Text>
        <Text className="text-gray-700 text-sm mb-2">
          • Verify payment information and customer details
        </Text>
        <Text className="text-gray-700 text-sm mb-2">
          • Check for any suspicious activity or duplicate orders
        </Text>
        <Text className="text-gray-700 text-sm mb-2">
          • Ensure all requested items are available and properly licensed
        </Text>
        <Text className="text-gray-700 text-sm">
          • Process approvals within 24 hours when possible
        </Text>
      </Section>

      <Text className="text-gray-700 text-base mb-4">
        Please review this purchase and take appropriate action. The customer
        will be notified automatically once you approve or reject the order.
      </Text>

      <Text className="text-gray-700 text-base">
        Admin Dashboard Team
        <br />
        Astewai Bookstore
      </Text>
    </BaseEmailLayout>
  );
}