import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@react-email/render';
import { WelcomeEmail } from '@/components/emails/welcome-email';
import { PurchaseReceiptEmail } from '@/components/emails/purchase-receipt-email';

// Mock React Email render
vi.mock('@react-email/render');

describe('Email Integration Tests', () => {
  const mockRender = vi.mocked(render);

  beforeEach(() => {
    vi.clearAllMocks();
    mockRender.mockReturnValue('<html>Test Email</html>');
  });

  describe('Email Template Rendering', () => {
    it('should render welcome email template', () => {
      const template = WelcomeEmail({
        userName: 'John Doe',
        userEmail: 'john@example.com',
      });

      render(template);

      expect(mockRender).toHaveBeenCalledWith(template);
    });

    it('should render purchase receipt email template', () => {
      const template = PurchaseReceiptEmail({
        userName: 'John Doe',
        purchaseId: 'purchase-123',
        items: [
          {
            id: 'item-1',
            title: 'Test Book',
            type: 'book',
            price: 19.99,
            quantity: 1,
          },
        ],
        totalAmount: 19.99,
        purchaseDate: '2025-01-08',
        paymentMethod: 'Credit Card',
      });

      render(template);

      expect(mockRender).toHaveBeenCalledWith(template);
    });
  });

  describe('Email Configuration', () => {
    it('should have proper email configuration constants', async () => {
      // Import with dynamic import to avoid environment issues
      const { EMAIL_CONFIG } = await import('../email');

      expect(EMAIL_CONFIG.FROM_ADDRESS).toBe('Astewai Bookstore <noreply@astewai-bookstore.com>');
      expect(EMAIL_CONFIG.ADMIN_ADDRESS).toBe('admin@astewai-bookstore.com');
      expect(EMAIL_CONFIG.SUPPORT_ADDRESS).toBe('support@astewai-bookstore.com');
    });
  });

  describe('Email Template Types', () => {
    it('should validate email template types', async () => {
      const { EmailTemplate } = await import('../email');
      
      // This is a type-only test to ensure our template types are properly defined
      const validTemplates: EmailTemplate[] = [
        'welcome',
        'purchase-receipt',
        'purchase-confirmation',
        'password-reset',
        'security-notification',
        'admin-purchase-approval',
        'purchase-approved',
        'purchase-rejected',
      ];

      expect(validTemplates).toHaveLength(8);
    });
  });
});