import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  sendWelcomeEmail,
  sendPurchaseReceiptEmail,
  sendPurchaseConfirmationEmail,
  sendPasswordResetEmail,
  sendSecurityNotificationEmail,
  sendAdminPurchaseApprovalEmail,
} from '../email-notifications';

// Mock the email service
vi.mock('../email', () => ({
  sendEmail: vi.fn(),
  sendBatchEmails: vi.fn(),
  EMAIL_CONFIG: {
    FROM_ADDRESS: 'Astewai Bookstore <noreply@astewai-bookstore.com>',
    ADMIN_ADDRESS: 'admin@astewai-bookstore.com',
    SUPPORT_ADDRESS: 'support@astewai-bookstore.com',
    SITE_URL: 'https://astewai-bookstore.com',
  },
}));

describe('Email Notifications', () => {
  const mockSendEmail = vi.fn();
  const mockSendBatchEmails = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    const emailModule = require('../email');
    emailModule.sendEmail = mockSendEmail;
    emailModule.sendBatchEmails = mockSendBatchEmails;
  });

  const mockUser = {
    id: 'user-123',
    name: 'John Doe',
    email: 'john@example.com',
  };

  const mockPurchase = {
    id: 'purchase-123',
    items: [
      {
        id: 'item-1',
        title: 'Test Book',
        type: 'book' as const,
        price: 19.99,
        quantity: 1,
      },
    ],
    totalAmount: 19.99,
    purchaseDate: '2025-01-08',
    paymentMethod: 'Credit Card',
  };

  describe('sendWelcomeEmail', () => {
    it('should send welcome email with correct parameters', async () => {
      mockSendEmail.mockResolvedValue({ success: true, id: 'email-123' });

      const result = await sendWelcomeEmail(mockUser);

      expect(mockSendEmail).toHaveBeenCalledWith({
        to: 'john@example.com',
        subject: 'Welcome to Astewai Bookstore, John Doe! 📚',
        template: expect.any(Object),
      });
      expect(result.success).toBe(true);
    });
  });

  describe('sendPurchaseReceiptEmail', () => {
    it('should send purchase receipt email with correct parameters', async () => {
      mockSendEmail.mockResolvedValue({ success: true, id: 'email-123' });

      const result = await sendPurchaseReceiptEmail(mockUser, mockPurchase);

      expect(mockSendEmail).toHaveBeenCalledWith({
        to: 'john@example.com',
        subject: 'Purchase Receipt - Order #purchase-123',
        template: expect.any(Object),
      });
      expect(result.success).toBe(true);
    });
  });

  describe('sendPurchaseConfirmationEmail', () => {
    it('should send purchase confirmation email with correct parameters', async () => {
      mockSendEmail.mockResolvedValue({ success: true, id: 'email-123' });

      const approvedDate = '2025-01-08';
      const result = await sendPurchaseConfirmationEmail(
        mockUser,
        mockPurchase,
        approvedDate
      );

      expect(mockSendEmail).toHaveBeenCalledWith({
        to: 'john@example.com',
        subject: 'Purchase Confirmed - Order #purchase-123 🎉',
        template: expect.any(Object),
      });
      expect(result.success).toBe(true);
    });
  });

  describe('sendPasswordResetEmail', () => {
    it('should send password reset email with correct parameters', async () => {
      mockSendEmail.mockResolvedValue({ success: true, id: 'email-123' });

      const resetUrl = 'https://example.com/reset?token=abc123';
      const result = await sendPasswordResetEmail(mockUser, resetUrl);

      expect(mockSendEmail).toHaveBeenCalledWith({
        to: 'john@example.com',
        subject: 'Reset Your Astewai Bookstore Password',
        template: expect.any(Object),
      });
      expect(result.success).toBe(true);
    });

    it('should use custom expiration time', async () => {
      mockSendEmail.mockResolvedValue({ success: true, id: 'email-123' });

      const resetUrl = 'https://example.com/reset?token=abc123';
      const expiresIn = '30 minutes';
      const result = await sendPasswordResetEmail(mockUser, resetUrl, expiresIn);

      expect(mockSendEmail).toHaveBeenCalled();
      expect(result.success).toBe(true);
    });
  });

  describe('sendSecurityNotificationEmail', () => {
    it('should send security notification email for login event', async () => {
      mockSendEmail.mockResolvedValue({ success: true, id: 'email-123' });

      const eventDetails = {
        timestamp: '2025-01-08 10:30:00',
        ipAddress: '192.168.1.1',
        location: 'New York, NY',
        device: 'Chrome on Windows',
      };

      const result = await sendSecurityNotificationEmail(
        mockUser,
        'login',
        eventDetails
      );

      expect(mockSendEmail).toHaveBeenCalledWith({
        to: 'john@example.com',
        subject: 'Security Alert: New Login to Your Account',
        template: expect.any(Object),
      });
      expect(result.success).toBe(true);
    });

    it('should send security notification email for suspicious activity', async () => {
      mockSendEmail.mockResolvedValue({ success: true, id: 'email-123' });

      const eventDetails = {
        timestamp: '2025-01-08 10:30:00',
        ipAddress: '192.168.1.1',
      };

      const result = await sendSecurityNotificationEmail(
        mockUser,
        'suspicious_activity',
        eventDetails
      );

      expect(mockSendEmail).toHaveBeenCalledWith({
        to: 'john@example.com',
        subject: 'Security Alert: 🚨 Suspicious Activity Detected',
        template: expect.any(Object),
      });
      expect(result.success).toBe(true);
    });
  });

  describe('sendAdminPurchaseApprovalEmail', () => {
    it('should send admin purchase approval email to default admin', async () => {
      mockSendBatchEmails.mockResolvedValue([{ success: true, id: 'email-123' }]);

      const result = await sendAdminPurchaseApprovalEmail(mockUser, mockPurchase);

      expect(mockSendBatchEmails).toHaveBeenCalledWith([
        {
          to: 'admin@astewai-bookstore.com',
          subject: '🔔 Purchase Approval Required - Order #purchase-123',
          template: expect.any(Object),
        },
      ]);
      expect(result).toEqual([{ success: true, id: 'email-123' }]);
    });

    it('should send admin purchase approval email to custom admin emails', async () => {
      mockSendBatchEmails.mockResolvedValue([
        { success: true, id: 'email-123' },
        { success: true, id: 'email-456' },
      ]);

      const adminEmails = ['admin1@example.com', 'admin2@example.com'];
      const result = await sendAdminPurchaseApprovalEmail(
        mockUser,
        mockPurchase,
        adminEmails
      );

      expect(mockSendBatchEmails).toHaveBeenCalledWith([
        {
          to: 'admin1@example.com',
          subject: '🔔 Purchase Approval Required - Order #purchase-123',
          template: expect.any(Object),
        },
        {
          to: 'admin2@example.com',
          subject: '🔔 Purchase Approval Required - Order #purchase-123',
          template: expect.any(Object),
        },
      ]);
      expect(result).toHaveLength(2);
    });
  });

  describe('error handling', () => {
    it('should handle email service failures gracefully', async () => {
      mockSendEmail.mockResolvedValue({ 
        success: false, 
        error: 'Email service unavailable' 
      });

      const result = await sendWelcomeEmail(mockUser);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Email service unavailable');
    });
  });
});