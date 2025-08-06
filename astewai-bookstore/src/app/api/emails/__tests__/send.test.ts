import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '../send/route';
import { NextRequest } from 'next/server';
import type { UserData, PurchaseData } from '@/lib/services/email-notifications';

// Mock dependencies
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('@/lib/services/email-notifications', () => ({
  sendWelcomeEmail: vi.fn(),
  sendPurchaseReceiptEmail: vi.fn(),
  sendPurchaseConfirmationEmail: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
  sendSecurityNotificationEmail: vi.fn(),
  sendAdminPurchaseApprovalEmail: vi.fn(),
}));

// Test data factories for better maintainability
const createTestUser = (overrides: Partial<UserData> = {}): UserData => ({
  id: 'user-123',
  name: 'John Doe',
  email: 'john@example.com',
  ...overrides,
});

const createTestPurchase = (overrides: Partial<PurchaseData> = {}): PurchaseData => ({
  id: 'purchase-123',
  items: [
    {
      id: 'book-1',
      title: 'Test Book',
      type: 'book' as const,
      price: 19.99,
      quantity: 1,
    },
  ],
  totalAmount: 19.99,
  purchaseDate: '2025-01-08T10:00:00Z',
  paymentMethod: 'stripe',
  ...overrides,
});

interface EmailRequestBody {
  type: string;
  data?: Record<string, unknown>;
}

describe('/api/emails/send', () => {
  // Centralized mock functions for better organization
  const mockCreateClient = vi.fn();
  const mockSendWelcomeEmail = vi.fn();
  const mockSendPurchaseReceiptEmail = vi.fn();
  const mockSendPurchaseConfirmationEmail = vi.fn();
  const mockSendPasswordResetEmail = vi.fn();
  const mockSendSecurityNotificationEmail = vi.fn();
  const mockSendAdminPurchaseApprovalEmail = vi.fn();
  
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup Supabase mocks
    const supabaseModule = require('@/lib/supabase/server');
    supabaseModule.createClient = mockCreateClient;
    
    // Setup email service mocks
    const emailModule = require('@/lib/services/email-notifications');
    emailModule.sendWelcomeEmail = mockSendWelcomeEmail;
    emailModule.sendPurchaseReceiptEmail = mockSendPurchaseReceiptEmail;
    emailModule.sendPurchaseConfirmationEmail = mockSendPurchaseConfirmationEmail;
    emailModule.sendPasswordResetEmail = mockSendPasswordResetEmail;
    emailModule.sendSecurityNotificationEmail = mockSendSecurityNotificationEmail;
    emailModule.sendAdminPurchaseApprovalEmail = mockSendAdminPurchaseApprovalEmail;
  });

  // Helper function with proper typing
  const createMockRequest = (body: EmailRequestBody): NextRequest => {
    return {
      json: vi.fn().mockResolvedValue(body),
    } as unknown as NextRequest;
  };

  // Reusable mock Supabase client
  const createMockSupabaseClient = () => ({
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn(),
  });

  // Helper to setup successful authentication
  const setupAuthenticatedUser = (client: ReturnType<typeof createMockSupabaseClient>, role: 'user' | 'admin' = 'user') => {
    client.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    });
    
    if (role === 'admin') {
      client.single.mockResolvedValue({
        data: { role: 'admin' },
        error: null,
      });
    } else {
      client.single.mockResolvedValue({
        data: { role: 'user' },
        error: null,
      });
    }
  };

  // Helper to setup unauthenticated user
  const setupUnauthenticatedUser = (client: ReturnType<typeof createMockSupabaseClient>) => {
    client.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: 'Not authenticated',
    });
  };

  describe('Welcome Email', () => {
    it('should send welcome email successfully', async () => {
      const mockClient = createMockSupabaseClient();
      mockCreateClient.mockResolvedValue(mockClient);
      setupUnauthenticatedUser(mockClient); // Welcome emails don't require auth
      
      mockSendWelcomeEmail.mockResolvedValue({
        success: true,
        id: 'email-123',
      });

      const testUser = createTestUser();
      const request = createMockRequest({
        type: 'welcome',
        data: { user: testUser },
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.id).toBe('email-123');
      expect(mockSendWelcomeEmail).toHaveBeenCalledWith(testUser);
    });

    it('should return 400 when user data is missing', async () => {
      const mockClient = createMockSupabaseClient();
      mockCreateClient.mockResolvedValue(mockClient);
      
      const request = createMockRequest({
        type: 'welcome',
        data: {}, // Missing user data
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.error).toBe('User data required for welcome email');
    });
  });

  describe('Purchase Receipt Email', () => {
    it('should send purchase receipt email for authenticated user', async () => {
      const mockClient = createMockSupabaseClient();
      mockCreateClient.mockResolvedValue(mockClient);
      setupAuthenticatedUser(mockClient);
      
      mockSendPurchaseReceiptEmail.mockResolvedValue({
        success: true,
        id: 'email-456',
      });

      const testUser = createTestUser();
      const testPurchase = createTestPurchase();
      const request = createMockRequest({
        type: 'purchase_receipt',
        data: { user: testUser, purchase: testPurchase },
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(mockSendPurchaseReceiptEmail).toHaveBeenCalledWith(testUser, testPurchase);
    });

    it('should return 401 for unauthenticated user', async () => {
      const mockClient = createMockSupabaseClient();
      mockCreateClient.mockResolvedValue(mockClient);
      setupUnauthenticatedUser(mockClient);

      const request = createMockRequest({
        type: 'purchase_receipt',
        data: {
          user: createTestUser(),
          purchase: createTestPurchase(),
        },
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(401);
      expect(responseData.error).toBe('Authentication required');
    });

    it('should return 400 when purchase data is missing', async () => {
      const mockClient = createMockSupabaseClient();
      mockCreateClient.mockResolvedValue(mockClient);
      setupAuthenticatedUser(mockClient);

      const request = createMockRequest({
        type: 'purchase_receipt',
        data: { user: createTestUser() }, // Missing purchase data
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.error).toBe('Purchase data required for receipt email');
    });
  });

  describe('Admin Purchase Approval Email', () => {
    it('should send admin approval email for admin user', async () => {
      const mockClient = createMockSupabaseClient();
      mockCreateClient.mockResolvedValue(mockClient);
      setupAuthenticatedUser(mockClient, 'admin');
      
      mockSendAdminPurchaseApprovalEmail.mockResolvedValue({
        success: true,
        id: 'email-789',
      });

      const testUser = createTestUser();
      const testPurchase = createTestPurchase();
      const request = createMockRequest({
        type: 'admin_purchase_approval',
        data: { user: testUser, purchase: testPurchase },
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(mockSendAdminPurchaseApprovalEmail).toHaveBeenCalledWith(
        testUser,
        testPurchase,
        undefined
      );
    });

    it('should return 403 for non-admin user', async () => {
      const mockClient = createMockSupabaseClient();
      mockCreateClient.mockResolvedValue(mockClient);
      setupAuthenticatedUser(mockClient, 'user'); // Regular user, not admin

      const request = createMockRequest({
        type: 'admin_purchase_approval',
        data: {
          user: createTestUser(),
          purchase: createTestPurchase(),
        },
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(403);
      expect(responseData.error).toBe('Admin access required');
    });
  });

  describe('Password Reset Email', () => {
    it('should send password reset email', async () => {
      const mockClient = createMockSupabaseClient();
      mockCreateClient.mockResolvedValue(mockClient);
      
      mockSendPasswordResetEmail.mockResolvedValue({
        success: true,
        id: 'email-reset-123',
      });

      const testUser = createTestUser();
      const resetUrl = 'https://example.com/reset?token=abc123';
      const request = createMockRequest({
        type: 'password_reset',
        data: { user: testUser, resetUrl },
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(mockSendPasswordResetEmail).toHaveBeenCalledWith(
        testUser,
        resetUrl,
        undefined
      );
    });

    it('should return 400 when reset URL is missing', async () => {
      const mockClient = createMockSupabaseClient();
      mockCreateClient.mockResolvedValue(mockClient);

      const request = createMockRequest({
        type: 'password_reset',
        data: { user: createTestUser() }, // Missing resetUrl
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.error).toBe('User data and reset URL required');
    });
  });

  describe('Error Handling', () => {
    it('should return 400 for missing required fields', async () => {
      const request = createMockRequest({
        type: 'welcome',
        // Missing data field
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.error).toBe('Missing required fields: type and data');
    });

    it('should return 400 for unknown email type', async () => {
      const mockClient = createMockSupabaseClient();
      mockCreateClient.mockResolvedValue(mockClient);

      const request = createMockRequest({
        type: 'unknown_type',
        data: { user: createTestUser() },
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.error).toBe('Unknown email type: unknown_type');
    });

    it('should return 500 for email service failures', async () => {
      const mockClient = createMockSupabaseClient();
      mockCreateClient.mockResolvedValue(mockClient);
      setupUnauthenticatedUser(mockClient);
      
      mockSendWelcomeEmail.mockResolvedValue({
        success: false,
        error: 'Email service unavailable',
      });

      const request = createMockRequest({
        type: 'welcome',
        data: { user: createTestUser() },
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(500);
      expect(responseData.error).toBe('Email service unavailable');
    });

    it('should handle internal server errors', async () => {
      mockCreateClient.mockRejectedValue(new Error('Database connection failed'));

      const request = createMockRequest({
        type: 'welcome',
        data: { user: createTestUser() },
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(500);
      expect(responseData.error).toBe('Internal server error');
    });

    it('should handle JSON parsing errors', async () => {
      const request = {
        json: vi.fn().mockRejectedValue(new Error('Invalid JSON')),
      } as unknown as NextRequest;

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(500);
      expect(responseData.error).toBe('Internal server error');
    });
  });

  describe('Security Notification Email', () => {
    it('should send security notification for authenticated user', async () => {
      const mockClient = createMockSupabaseClient();
      mockCreateClient.mockResolvedValue(mockClient);
      setupAuthenticatedUser(mockClient);
      
      mockSendSecurityNotificationEmail.mockResolvedValue({
        success: true,
        id: 'email-security-123',
      });

      const testUser = createTestUser();
      const eventDetails = {
        timestamp: '2025-01-08T10:00:00Z',
        ipAddress: '192.168.1.1',
        location: 'New York, NY',
      };

      const request = createMockRequest({
        type: 'security_notification',
        data: {
          user: testUser,
          eventType: 'login',
          eventDetails,
        },
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(mockSendSecurityNotificationEmail).toHaveBeenCalledWith(
        testUser,
        'login',
        eventDetails
      );
    });
  });
});