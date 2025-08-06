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

interface PurchaseConfirmationEmailProps {
  userName: string;
  purchaseId: string;
  items: PurchaseItem[];
  totalAmount: number;
  approvedDate: string;
}

export function PurchaseConfirmationEmail({
  userName,
  purchaseId,
  items,
  totalAmount,
  approvedDate,
}: PurchaseConfirmationEmailProps) {
  const formatPrice = (price: number) => `$${price.toFixed(2)}`;

  return (
    <BaseEmailLayout previewText={`Purchase Confirmed - Order #${purchaseId}`}>
      <Heading className="text-2xl font-bold text-gray-900 mb-6">
        Purchase Confirmed! 🎉
      </Heading>

      <Text className="text-gray-700 text-base mb-4">
        Hi {userName},
      </Text>

      <Text className="text-gray-700 text-base mb-6">
        Great news! Your purchase has been approved and confirmed. All items have
        been added to your digital library and are ready for reading.
      </Text>

      {/* Order Details */}
      <Section className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
        <Row>
          <Column>
            <Text className="text-sm text-green-700 mb-1">Order Number</Text>
            <Text className="text-base font-semibold text-green-900">
              #{purchaseId}
            </Text>
          </Column>
          <Column>
            <Text className="text-sm text-green-700 mb-1">Confirmed Date</Text>
            <Text className="text-base font-semibold text-green-900">
              {approvedDate}
            </Text>
          </Column>
        </Row>
        <Row className="mt-4">
          <Column>
            <Text className="text-sm text-green-700 mb-1">Status</Text>
            <Text className="text-base font-bold text-green-600">
              ✅ Confirmed & Available
            </Text>
          </Column>
          <Column>
            <Text className="text-sm text-green-700 mb-1">Total Amount</Text>
            <Text className="text-base font-bold text-green-900">
              {formatPrice(totalAmount)}
            </Text>
          </Column>
        </Row>
      </Section>

      {/* Items */}
      <Section className="mb-6">
        <Heading className="text-lg font-semibold text-gray-900 mb-4">
          Your New Books & Bundles
        </Heading>
        
        {items.map((item) => (
          <Section key={item.id} className="border-b border-gray-200 pb-4 mb-4">
            <Row>
              <Column className="w-3/4">
                <Text className="text-base font-medium text-gray-900 mb-1">
                  {item.title}
                </Text>
                <Text className="text-sm text-gray-600">
                  {item.type === 'bundle' ? 'Book Bundle' : 'Digital Book'} • Now in your library
                </Text>
              </Column>
              <Column className="w-1/4 text-right">
                <Text className="text-sm font-medium text-green-600">
                  ✅ Available
                </Text>
              </Column>
            </Row>
          </Section>
        ))}
      </Section>

      {/* Call to Action */}
      <Section className="bg-blue-50 rounded-lg p-4 mb-6 text-center">
        <Text className="text-blue-800 text-base font-medium mb-4">
          🚀 Ready to start reading?
        </Text>
        <Button
          href="https://astewai-bookstore.com/library"
          className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium inline-block text-decoration-none mr-4"
        >
          Open My Library
        </Button>
        <Button
          href="https://astewai-bookstore.com/books"
          className="bg-gray-600 text-white px-6 py-3 rounded-lg font-medium inline-block text-decoration-none"
        >
          Discover More Books
        </Button>
      </Section>

      {/* Reading Tips */}
      <Section className="bg-gray-50 rounded-lg p-4 mb-6">
        <Text className="text-gray-800 text-base font-medium mb-3">
          📖 Reading Tips:
        </Text>
        <Text className="text-gray-700 text-sm mb-2">
          • Access your books anytime from the Library section
        </Text>
        <Text className="text-gray-700 text-sm mb-2">
          • Your reading progress is automatically saved
        </Text>
        <Text className="text-gray-700 text-sm mb-2">
          • Use bookmarks to save your favorite passages
        </Text>
        <Text className="text-gray-700 text-sm">
          • Rate and review books to help other readers
        </Text>
      </Section>

      <Text className="text-gray-700 text-base mb-4">
        Thank you for your purchase! We hope you enjoy your new books. If you
        need any assistance with accessing your library or have questions,
        our support team is here to help.
      </Text>

      <Text className="text-gray-700 text-base">
        Happy reading! 📚
        <br />
        The Astewai Bookstore Team
      </Text>
    </BaseEmailLayout>
  );
}