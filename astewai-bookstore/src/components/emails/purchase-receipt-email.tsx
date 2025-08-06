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

interface PurchaseReceiptEmailProps {
  userName: string;
  purchaseId: string;
  items: PurchaseItem[];
  totalAmount: number;
  purchaseDate: string;
  paymentMethod?: string;
}

export function PurchaseReceiptEmail({
  userName,
  purchaseId,
  items,
  totalAmount,
  purchaseDate,
  paymentMethod = 'Credit Card',
}: PurchaseReceiptEmailProps) {
  const formatPrice = (price: number) => `$${price.toFixed(2)}`;

  return (
    <BaseEmailLayout previewText={`Purchase Receipt - Order #${purchaseId}`}>
      <Heading className="text-2xl font-bold text-gray-900 mb-6">
        Purchase Receipt 🧾
      </Heading>

      <Text className="text-gray-700 text-base mb-4">
        Hi {userName},
      </Text>

      <Text className="text-gray-700 text-base mb-6">
        Thank you for your purchase! Your order has been received and is currently
        being processed. Here are the details of your purchase:
      </Text>

      {/* Order Details */}
      <Section className="bg-gray-50 rounded-lg p-4 mb-6">
        <Row>
          <Column>
            <Text className="text-sm text-gray-600 mb-1">Order Number</Text>
            <Text className="text-base font-semibold text-gray-900">
              #{purchaseId}
            </Text>
          </Column>
          <Column>
            <Text className="text-sm text-gray-600 mb-1">Purchase Date</Text>
            <Text className="text-base font-semibold text-gray-900">
              {purchaseDate}
            </Text>
          </Column>
        </Row>
        <Row className="mt-4">
          <Column>
            <Text className="text-sm text-gray-600 mb-1">Payment Method</Text>
            <Text className="text-base font-semibold text-gray-900">
              {paymentMethod}
            </Text>
          </Column>
          <Column>
            <Text className="text-sm text-gray-600 mb-1">Status</Text>
            <Text className="text-base font-semibold text-orange-600">
              Pending Approval
            </Text>
          </Column>
        </Row>
      </Section>

      {/* Items */}
      <Section className="mb-6">
        <Heading className="text-lg font-semibold text-gray-900 mb-4">
          Items Purchased
        </Heading>
        
        {items.map((item) => (
          <Section key={item.id} className="border-b border-gray-200 pb-4 mb-4">
            <Row>
              <Column className="w-3/4">
                <Text className="text-base font-medium text-gray-900 mb-1">
                  {item.title}
                </Text>
                <Text className="text-sm text-gray-600">
                  {item.type === 'bundle' ? 'Book Bundle' : 'Digital Book'} • Qty: {item.quantity}
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
        <Section className="bg-blue-50 rounded-lg p-4">
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

      {/* Next Steps */}
      <Section className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <Text className="text-yellow-800 text-base font-medium mb-2">
          ⏳ What happens next?
        </Text>
        <Text className="text-yellow-700 text-sm mb-2">
          • Your purchase is currently pending admin approval
        </Text>
        <Text className="text-yellow-700 text-sm mb-2">
          • You'll receive a confirmation email once approved
        </Text>
        <Text className="text-yellow-700 text-sm">
          • Approved items will be added to your library automatically
        </Text>
      </Section>

      <Section className="text-center mb-6">
        <Button
          href="https://astewai-bookstore.com/profile/purchases"
          className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium inline-block text-decoration-none"
        >
          View Purchase History
        </Button>
      </Section>

      <Text className="text-gray-700 text-base mb-4">
        If you have any questions about your purchase, please don't hesitate to
        contact our support team.
      </Text>

      <Text className="text-gray-700 text-base">
        Thank you for choosing Astewai Bookstore!
        <br />
        The Astewai Team
      </Text>
    </BaseEmailLayout>
  );
}