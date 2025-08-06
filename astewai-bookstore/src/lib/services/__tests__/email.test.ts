import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WelcomeEmail } from '@/components/emails/welcome-email';
import { sendEmail, sendBatchEmails } from '../email';

// Mock Resend
const mockResendSend = vi.fn();
const mockResendConstructor = vi.fn().mockImplementation(() => ({
  emails: {
    send: mockResendSend,
  },
}));

vi.mock('resend', () => ({
  Resend: mockResendConstructor,
}));

// Mock React Email render
vi.mock('@react-email/render', () => ({
  render: vi.fn().mockReturnValue('<html>Test Email</html>'),
}));

describe('Email Service', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    mockResendSend.mockClear();
    mockResendConstructor.mockClear();
    // Reset environment variables for clean test state
    vi.stubEnv('NODE_ENV', 'test');
    vi.stubEnv('VITEST', 'true');
    
    // Dynamic import to ensure mocks are applied
    const emailModule = await import('../email');
    sendEmail = emailModule.sendEmail;
    sendBatchEmails = emailModule.sendBatchEmails;
  });

  describe('sendEmail', () => {
    it('should send email successfully', async () => {
      mockResendSend.mockResolvedValue({
        data: { id: 'test-email-id' },
        error: null,
      });

      const result = await sendEmail({
        to: 'test@example.com',
        subject: 'Test Email',
        template: WelcomeEmail({
          userName: 'Test User',
          userEmail: 'test@example.com',
        }),
      });

      expect(result.success).toBe(true);
      expect(result.id).toBe('test-email-id');
      expect(mockResendSend).toHaveBeenCalledWith({
        from: 'Astewai Bookstore <noreply@astewai-bookstore.com>',
        to: ['test@example.com'],
        subject: 'Test Email',
        html: '<html>Test Email</html>',
      });
    });

    it('should handle email sending failure', async () => {
      mockResendSend.mockResolvedValue({
        data: null,
        error: { message: 'Email sending failed' },
      });

      const result = await sendEmail({
        to: 'test@example.com',
        subject: 'Test Email',
        template: WelcomeEmail({
          userName: 'Test User',
          userEmail: 'test@example.com',
        }),
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Email sending failed');
    });

    it('should handle multiple recipients', async () => {
      mockResendSend.mockResolvedValue({
        data: { id: 'test-email-id' },
        error: null,
      });

      const recipients = ['test1@example.com', 'test2@example.com'];
      
      const result = await sendEmail({
        to: recipients,
        subject: 'Test Email',
        template: WelcomeEmail({
          userName: 'Test User',
          userEmail: 'test1@example.com',
        }),
      });

      expect(result.success).toBe(true);
      expect(mockResendSend).toHaveBeenCalledWith({
        from: 'Astewai Bookstore <noreply@astewai-bookstore.com>',
        to: recipients,
        subject: 'Test Email',
        html: '<html>Test Email</html>',
      });
    });

    it('should use custom from address', async () => {
      mockResendSend.mockResolvedValue({
        data: { id: 'test-email-id' },
        error: null,
      });

      const result = await sendEmail({
        to: 'test@example.com',
        subject: 'Test Email',
        template: WelcomeEmail({
          userName: 'Test User',
          userEmail: 'test@example.com',
        }),
        from: 'Custom Sender <custom@example.com>',
      });

      expect(result.success).toBe(true);
      expect(mockResendSend).toHaveBeenCalledWith({
        from: 'Custom Sender <custom@example.com>',
        to: ['test@example.com'],
        subject: 'Test Email',
        html: '<html>Test Email</html>',
      });
    });

    it('should handle exceptions', async () => {
      mockResendSend.mockRejectedValue(new Error('Network error'));

      const result = await sendEmail({
        to: 'test@example.com',
        subject: 'Test Email',
        template: WelcomeEmail({
          userName: 'Test User',
          userEmail: 'test@example.com',
        }),
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
    });
  });

  describe('sendBatchEmails', () => {
    it('should send multiple emails successfully', async () => {
      mockResendSend
        .mockResolvedValueOnce({
          data: { id: 'email-1' },
          error: null,
        })
        .mockResolvedValueOnce({
          data: { id: 'email-2' },
          error: null,
        });

      const emails = [
        {
          to: 'test1@example.com',
          subject: 'Test Email 1',
          template: WelcomeEmail({
            userName: 'Test User 1',
            userEmail: 'test1@example.com',
          }),
        },
        {
          to: 'test2@example.com',
          subject: 'Test Email 2',
          template: WelcomeEmail({
            userName: 'Test User 2',
            userEmail: 'test2@example.com',
          }),
        },
      ];

      const results = await sendBatchEmails(emails);

      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(true);
      expect(results[0].id).toBe('email-1');
      expect(results[1].success).toBe(true);
      expect(results[1].id).toBe('email-2');
    });

    it('should handle mixed success and failure', async () => {
      mockResendSend
        .mockResolvedValueOnce({
          data: { id: 'email-1' },
          error: null,
        })
        .mockRejectedValueOnce(new Error('Failed to send'));

      const emails = [
        {
          to: 'test1@example.com',
          subject: 'Test Email 1',
          template: WelcomeEmail({
            userName: 'Test User 1',
            userEmail: 'test1@example.com',
          }),
        },
        {
          to: 'test2@example.com',
          subject: 'Test Email 2',
          template: WelcomeEmail({
            userName: 'Test User 2',
            userEmail: 'test2@example.com',
          }),
        },
      ];

      const results = await sendBatchEmails(emails);

      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(true);
      expect(results[0].id).toBe('email-1');
      expect(results[1].success).toBe(false);
      expect(results[1].error).toBe('Batch email failed');
    });
  });

  describe('sendEmailWithRetry', () => {
    it('should succeed on first attempt', async () => {
      mockResendSend.mockResolvedValue({
        data: { id: 'test-email-id' },
        error: null,
      });

      const result = await sendEmailWithRetry({
        to: 'test@example.com',
        subject: 'Test Email',
        template: WelcomeEmail({
          userName: 'Test User',
          userEmail: 'test@example.com',
        }),
      });

      expect(result.success).toBe(true);
      expect(mockResendSend).toHaveBeenCalledTimes(1);
    });

    it('should retry on retryable errors', async () => {
      mockResendSend
        .mockResolvedValueOnce({
          data: null,
          error: { name: 'network_error', message: 'Network timeout' },
        })
        .mockResolvedValueOnce({
          data: { id: 'test-email-id' },
          error: null,
        });

      const result = await sendEmailWithRetry({
        to: 'test@example.com',
        subject: 'Test Email',
        template: WelcomeEmail({
          userName: 'Test User',
          userEmail: 'test@example.com',
        }),
      }, { maxAttempts: 2, baseDelay: 10 });

      expect(result.success).toBe(true);
      expect(mockResendSend).toHaveBeenCalledTimes(2);
    });

    it('should not retry on non-retryable errors', async () => {
      mockResendSend.mockResolvedValue({
        data: null,
        error: { name: 'api_error', code: 'invalid_api_key', message: 'Invalid API key' },
      });

      const result = await sendEmailWithRetry({
        to: 'test@example.com',
        subject: 'Test Email',
        template: WelcomeEmail({
          userName: 'Test User',
          userEmail: 'test@example.com',
        }),
      }, { maxAttempts: 3, baseDelay: 10 });

      expect(result.success).toBe(false);
      expect(mockResendSend).toHaveBeenCalledTimes(1);
    });
  });

  describe('checkEmailServiceHealth', () => {
    it('should return healthy status when properly configured', async () => {
      vi.stubEnv('RESEND_API_KEY', 'test-key');
      
      const health = await checkEmailServiceHealth();
      
      expect(health.healthy).toBe(true);
      expect(health.details?.configValid).toBe(true);
      expect(health.details?.apiKeyPresent).toBe(true);
    });

    it('should return unhealthy status when API key is missing', async () => {
      vi.stubEnv('RESEND_API_KEY', '');
      
      const health = await checkEmailServiceHealth();
      
      expect(health.healthy).toBe(false);
      expect(health.error).toBeDefined();
    });
  });

  describe('template caching', () => {
    it('should cache rendered templates', async () => {
      const renderSpy = vi.spyOn(require('@react-email/render'), 'render');
      
      mockResendSend.mockResolvedValue({
        data: { id: 'test-email-id' },
        error: null,
      });

      // Send same template twice
      const template = WelcomeEmail({
        userName: 'Test User',
        userEmail: 'test@example.com',
      });

      await sendEmail({
        to: 'test1@example.com',
        subject: 'Test Email',
        template,
        tags: ['template:welcome'],
      });

      await sendEmail({
        to: 'test2@example.com',
        subject: 'Test Email',
        template,
        tags: ['template:welcome'],
      });

      // Template should only be rendered once due to caching
      expect(renderSpy).toHaveBeenCalledTimes(1);
    });
  });
});