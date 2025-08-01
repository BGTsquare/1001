import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EmailNotificationService, createNotificationService } from '../notification-service';
import { createClient } from '@/lib/supabase/server';
import type { PurchaseRequest } from '@/types';

// Mock Supabase client
vi.mock('@/lib/supabase/server');

const mockSupabase = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        eq: vi.fn(() => ({ data: [], error: null }))
      }))
    }))
  }))
};

describe('NotificationService', () => {
  let notificationService: EmailNotificationService;

  beforeEach(() => {
    vi.clearAllMocks();
    (createClient as any).mockReturnValue(mockSupabase);
    notificationService = new EmailNotificationService();
  });

  describe('createNotificationService', () => {
    it('should create an EmailNotificationService instance', () => {
      const service = createNotificationService();
      expect(service).toBeInstanceOf(EmailNotificationService);
    });
  });

  describe('sendEmailNotification', () => {
    it('should log email notification details', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      await notificationService.sendEmailNotification(
        'admin@example.com',
        'Test Subject',
        'Test Content'
      );

      expect(consoleSpy).toHaveBeenCalledWith('Email Notification:', {
        to: 'admin@example.com',
        subject: 'Test Subject',
        content: 'Test Content',
        timestamp: expect.any(String)
      });

      consoleSpy.mockRestore();
    });

    it('should handle email sending errors', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      // Mock a failure scenario by throwing an error
      vi.spyOn(global, 'setTimeout').mockImplementation(() => {
        throw new Error('Email service unavailable');
      });

      await expect(
        notificationService.sendEmailNotification('admin@example.com', 'Test', 'Content')
      ).rejects.toThrow('Email service unavailable');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to send email notification to admin@example.com:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('notifyAdminsOfNewPurchaseRequest', () => {
    const mockPurchaseRequest: PurchaseRequest = {
      id: '1',
      user_id: 'user-1',
      item_type: 'book',
      item_id: 'book-1',
      amount: 29.99,
      status: 'pending',
      preferred_contact_method: 'email',
      user_message: 'Please process quickly',
      admin_notes: null,
      contacted_at: null,
      responded_at: null,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      book: {
        id: 'book-1',
        title: 'Test Book',
        author: 'Test Author',
        description: 'Test Description',
        cover_image_url: null,
        content_url: null,
        price: 29.99,
        is_free: false,
        category: null,
        tags: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
    };

    it('should notify admins when admin profiles and contacts exist', async () => {
      // Mock admin profiles
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            data: [{ id: 'admin-1', display_name: 'Admin User' }],
            error: null
          }))
        }))
      });

      // Mock admin contacts
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              data: [{ 
                id: '1', 
                admin_id: 'admin-1', 
                contact_type: 'email', 
                contact_value: 'admin@example.com',
                is_active: true 
              }],
              error: null
            }))
          }))
        }))
      });

      const sendEmailSpy = vi.spyOn(notificationService, 'sendEmailNotification')
        .mockResolvedValue();
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await notificationService.notifyAdminsOfNewPurchaseRequest(mockPurchaseRequest);

      expect(sendEmailSpy).toHaveBeenCalledWith(
        'admin@example.com',
        'New Purchase Request - Book',
        expect.stringContaining('Test Book')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        'Sent purchase request notifications to 1 admin contacts'
      );

      sendEmailSpy.mockRestore();
      consoleSpy.mockRestore();
    });

    it('should handle case when no admin profiles exist', async () => {
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            data: [],
            error: null
          }))
        }))
      });

      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      await notificationService.notifyAdminsOfNewPurchaseRequest(mockPurchaseRequest);

      expect(consoleWarnSpy).toHaveBeenCalledWith('No admin users found for notification');
      consoleWarnSpy.mockRestore();
    });

    it('should handle case when no admin email contacts exist', async () => {
      // Mock admin profiles exist
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            data: [{ id: 'admin-1', display_name: 'Admin User' }],
            error: null
          }))
        }))
      });

      // Mock no admin contacts
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              data: [],
              error: null
            }))
          }))
        }))
      });

      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      await notificationService.notifyAdminsOfNewPurchaseRequest(mockPurchaseRequest);

      expect(consoleWarnSpy).toHaveBeenCalledWith('No admin email contacts found for notification');
      consoleWarnSpy.mockRestore();
    });

    it('should handle database errors gracefully', async () => {
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            data: null,
            error: { message: 'Database connection failed' }
          }))
        }))
      });

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await notificationService.notifyAdminsOfNewPurchaseRequest(mockPurchaseRequest);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to fetch admin profiles:',
        { message: 'Database connection failed' }
      );
      consoleErrorSpy.mockRestore();
    });

    it('should generate correct notification content for book', async () => {
      // Mock successful setup
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            data: [{ id: 'admin-1', display_name: 'Admin User' }],
            error: null
          }))
        }))
      });

      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              data: [{ 
                id: '1', 
                admin_id: 'admin-1', 
                contact_type: 'email', 
                contact_value: 'admin@example.com',
                is_active: true 
              }],
              error: null
            }))
          }))
        }))
      });

      const sendEmailSpy = vi.spyOn(notificationService, 'sendEmailNotification')
        .mockResolvedValue();

      await notificationService.notifyAdminsOfNewPurchaseRequest(mockPurchaseRequest);

      expect(sendEmailSpy).toHaveBeenCalledWith(
        'admin@example.com',
        'New Purchase Request - Book',
        expect.stringContaining('Item: Test Book (Book)')
      );
      expect(sendEmailSpy).toHaveBeenCalledWith(
        'admin@example.com',
        'New Purchase Request - Book',
        expect.stringContaining('Amount: $29.99')
      );
      expect(sendEmailSpy).toHaveBeenCalledWith(
        'admin@example.com',
        'New Purchase Request - Book',
        expect.stringContaining('User Message: Please process quickly')
      );

      sendEmailSpy.mockRestore();
    });

    it('should generate correct notification content for bundle', async () => {
      const bundleRequest = {
        ...mockPurchaseRequest,
        item_type: 'bundle' as const,
        book: undefined,
        bundle: {
          id: 'bundle-1',
          title: 'Test Bundle',
          description: 'Test Bundle Description',
          price: 49.99,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        }
      };

      // Mock successful setup
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            data: [{ id: 'admin-1', display_name: 'Admin User' }],
            error: null
          }))
        }))
      });

      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              data: [{ 
                id: '1', 
                admin_id: 'admin-1', 
                contact_type: 'email', 
                contact_value: 'admin@example.com',
                is_active: true 
              }],
              error: null
            }))
          }))
        }))
      });

      const sendEmailSpy = vi.spyOn(notificationService, 'sendEmailNotification')
        .mockResolvedValue();

      await notificationService.notifyAdminsOfNewPurchaseRequest(bundleRequest);

      expect(sendEmailSpy).toHaveBeenCalledWith(
        'admin@example.com',
        'New Purchase Request - Bundle',
        expect.stringContaining('Item: Test Bundle (Bundle)')
      );

      sendEmailSpy.mockRestore();
    });
  });
});