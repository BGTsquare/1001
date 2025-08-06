import { Resend } from 'resend';
import { render } from '@react-email/render';
import { ReactElement } from 'react';
import { z } from 'zod';

// Email validation schema
const emailSchema = z.string().email();
const emailArraySchema = z.array(emailSchema).min(1);

// Environment validation with test fallbacks
const emailEnvSchema = z.object({
  RESEND_API_KEY: z.string().min(1, 'RESEND_API_KEY is required'),
  NEXT_PUBLIC_SITE_URL: z.string().url().optional(),
});

// Simplified configuration management
interface EmailEnvironment {
  apiKey: string;
  siteUrl: string;
  isTest: boolean;
}

function getEmailEnvironment(): EmailEnvironment {
  const isTest = process.env.NODE_ENV === 'test' || process.env.VITEST === 'true';
  
  const rawEnv = {
    RESEND_API_KEY: process.env.RESEND_API_KEY || (isTest ? 'test-api-key' : ''),
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || (isTest ? 'https://test.com' : 'https://astewai-bookstore.com'),
  };

  try {
    const validatedEnv = emailEnvSchema.parse(rawEnv);
    return {
      apiKey: validatedEnv.RESEND_API_KEY,
      siteUrl: validatedEnv.NEXT_PUBLIC_SITE_URL || 'https://astewai-bookstore.com',
      isTest,
    };
  } catch (error) {
    if (isTest) {
      return { apiKey: 'test-api-key', siteUrl: 'https://test.com', isTest: true };
    }
    throw new Error(`Email configuration invalid: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Environment configuration with better separation
class EmailConfig {
  private static instance: EmailConfig;
  private _env: EmailEnvironment | null = null;
  private _resend: Resend | null = null;

  private constructor() {}

  static getInstance(): EmailConfig {
    if (!EmailConfig.instance) {
      EmailConfig.instance = new EmailConfig();
    }
    return EmailConfig.instance;
  }

  private getEnvironment(): EmailEnvironment {
    if (this._env) return this._env;
    this._env = getEmailEnvironment();
    return this._env;
  }

  getResendClient(): Resend {
    if (this._resend) return this._resend;

    const env = this.getEnvironment();
    
    try {
      this._resend = new Resend(env.apiKey);
      return this._resend;
    } catch (error) {
      console.error('Failed to initialize Resend client:', error);
      throw new Error('Email service initialization failed');
    }
  }

  get siteUrl(): string {
    return this.getEnvironment().siteUrl;
  }

  // For testing - allow resetting the singleton
  static reset(): void {
    EmailConfig.instance = new EmailConfig();
  }
}

// Export singleton instance
const emailConfig = EmailConfig.getInstance();

export interface EmailOptions {
  to: string | string[];
  subject: string;
  template: ReactElement;
  from?: string;
  replyTo?: string;
  tags?: string[];
}

// Enhanced result types with better error categorization
export type EmailError = 
  | { type: 'validation'; message: string; field?: string; code: 'INVALID_EMAIL' | 'MISSING_SUBJECT' | 'INVALID_TEMPLATE' }
  | { type: 'service'; message: string; code?: string; statusCode?: number }
  | { type: 'network'; message: string; retryable: boolean; timeout?: boolean }
  | { type: 'rate_limit'; message: string; retryAfter?: number; limit?: number }
  | { type: 'template_render'; message: string; templateName?: string }
  | { type: 'unknown'; message: string; originalError?: unknown };

export interface EmailResult {
  success: boolean;
  id?: string;
  error?: EmailError;
  metadata?: {
    timestamp: Date;
    recipient: string;
    template?: string;
  };
}

export interface EmailMetadata {
  template: EmailTemplate;
  userId?: string;
  timestamp: Date;
}

/**
 * Validate email addresses
 */
function validateEmailAddresses(to: string | string[]): string[] {
  const emails = Array.isArray(to) ? to : [to];
  
  try {
    emailArraySchema.parse(emails);
    return emails;
  } catch (error) {
    throw new Error(`Invalid email address(es): ${emails.join(', ')}`);
  }
}

/**
 * Enhanced email validation with detailed error reporting
 */
function validateEmailInputs(options: EmailOptions): { 
  validatedEmails: string[]; 
  errors: EmailError[] 
} {
  const errors: EmailError[] = [];
  let validatedEmails: string[] = [];

  // Validate subject
  if (!options.subject?.trim()) {
    errors.push({ 
      type: 'validation', 
      message: 'Email subject cannot be empty', 
      field: 'subject',
      code: 'MISSING_SUBJECT'
    });
  }

  // Validate email addresses
  try {
    validatedEmails = validateEmailAddresses(options.to);
  } catch (error) {
    errors.push({ 
      type: 'validation', 
      message: error instanceof Error ? error.message : 'Invalid email addresses',
      field: 'to',
      code: 'INVALID_EMAIL'
    });
  }

  // Validate reply-to if provided
  if (options.replyTo) {
    try {
      emailSchema.parse(options.replyTo);
    } catch {
      errors.push({ 
        type: 'validation', 
        message: 'Invalid reply-to email address',
        field: 'replyTo',
        code: 'INVALID_EMAIL'
      });
    }
  }

  // Validate template
  if (!options.template) {
    errors.push({
      type: 'validation',
      message: 'Email template is required',
      field: 'template',
      code: 'INVALID_TEMPLATE'
    });
  }

  return { validatedEmails, errors };
}

/**
 * Categorize Resend API errors for better handling
 */
function categorizeResendError(error: any): EmailError {
  if (!error) return { type: 'unknown', message: 'Unknown email service error' };

  const message = error.message || 'Email service error';

  // Rate limiting
  if (error.name === 'rate_limit_exceeded' || message.includes('rate limit')) {
    return { 
      type: 'rate_limit', 
      message: 'Email rate limit exceeded',
      retryAfter: error.retryAfter 
    };
  }

  // Network/service errors
  if (error.name === 'network_error' || message.includes('network')) {
    return { 
      type: 'network', 
      message: 'Network error while sending email',
      retryable: true 
    };
  }

  // Service errors
  if (error.name === 'api_error' || error.code) {
    return { 
      type: 'service', 
      message,
      code: error.code 
    };
  }

  return { type: 'unknown', message };
}

// Template rendering cache
const templateCache = new Map<string, string>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const cacheTimestamps = new Map<string, number>();

/**
 * Render template with caching for performance
 */
function renderTemplateWithCache(template: ReactElement, cacheKey?: string): string {
  if (cacheKey) {
    const cached = templateCache.get(cacheKey);
    const timestamp = cacheTimestamps.get(cacheKey);
    
    if (cached && timestamp && Date.now() - timestamp < CACHE_TTL) {
      return cached;
    }
  }

  const html = render(template);
  
  if (cacheKey) {
    templateCache.set(cacheKey, html);
    cacheTimestamps.set(cacheKey, Date.now());
  }
  
  return html;
}

/**
 * Send an email using Resend service with enhanced error handling
 */
export async function sendEmail({
  to,
  subject,
  template,
  from = EMAIL_CONFIG.FROM_ADDRESS,
  replyTo,
  tags = [],
}: EmailOptions): Promise<EmailResult> {
  const startTime = Date.now();
  const primaryRecipient = Array.isArray(to) ? to[0] : to;

  try {
    // Validate all inputs upfront
    const { validatedEmails, errors } = validateEmailInputs({ to, subject, template, from, replyTo, tags });
    
    if (errors.length > 0) {
      return {
        success: false,
        error: errors[0], // Return first validation error
        metadata: {
          timestamp: new Date(),
          recipient: primaryRecipient,
        }
      };
    }

    // Render template with caching and error handling
    let html: string;
    try {
      // Generate cache key based on template type if available
      const cacheKey = tags.find(tag => tag.startsWith('template:'))?.replace('template:', '');
      html = renderTemplateWithCache(template, cacheKey);
    } catch (renderError) {
      return {
        success: false,
        error: { 
          type: 'validation', 
          message: `Template rendering failed: ${renderError instanceof Error ? renderError.message : 'Unknown error'}`,
          field: 'template'
        },
        metadata: {
          timestamp: new Date(),
          recipient: primaryRecipient,
        }
      };
    }

    // Prepare email payload
    const emailPayload: any = {
      from,
      to: validatedEmails,
      subject: subject.trim(),
      html,
    };

    if (replyTo) emailPayload.replyTo = replyTo;
    if (tags.length > 0) emailPayload.tags = tags;

    // Send email
    const resend = emailConfig.getResendClient();
    const { data, error } = await resend.emails.send(emailPayload);

    if (error) {
      const categorizedError = categorizeResendError(error);
      console.error('Email sending failed:', {
        error: categorizedError,
        to: validatedEmails,
        subject,
        from,
        duration: Date.now() - startTime,
      });

      return {
        success: false,
        error: categorizedError,
        metadata: {
          timestamp: new Date(),
          recipient: primaryRecipient,
        }
      };
    }

    console.log('Email sent successfully:', {
      id: data?.id,
      to: validatedEmails,
      subject,
      duration: Date.now() - startTime,
    });

    return {
      success: true,
      id: data?.id,
      metadata: {
        timestamp: new Date(),
        recipient: primaryRecipient,
      }
    };

  } catch (error) {
    const categorizedError: EmailError = error instanceof Error 
      ? { type: 'unknown', message: error.message }
      : { type: 'unknown', message: 'Unexpected error occurred' };

    console.error('Email service error:', {
      error: categorizedError,
      to: primaryRecipient,
      subject,
      duration: Date.now() - startTime,
    });
    
    return {
      success: false,
      error: categorizedError,
      metadata: {
        timestamp: new Date(),
        recipient: primaryRecipient,
      }
    };
  }
}

/**
 * Send multiple emails in batch with rate limiting and error handling
 * 
 * @param emails - Array of email options to send
 * @param options - Batch processing configuration
 * @param options.concurrency - Number of emails to send concurrently (default: 5)
 * @param options.delayMs - Delay between individual emails in ms (default: 100)
 * @param options.failFast - Stop processing on first failure (default: false)
 * @returns Promise resolving to array of email results
 * 
 * @example
 * ```typescript
 * const results = await sendBatchEmails([
 *   { to: 'user1@example.com', subject: 'Welcome', template: welcomeTemplate },
 *   { to: 'user2@example.com', subject: 'Welcome', template: welcomeTemplate }
 * ], { concurrency: 3, delayMs: 200 });
 * ```
 */
export async function sendBatchEmails(
  emails: EmailOptions[],
  options: { 
    concurrency?: number; 
    delayMs?: number;
    failFast?: boolean;
  } = {}
): Promise<EmailResult[]> {
  const { 
    concurrency = 5, 
    delayMs = 100,
    failFast = false 
  } = options;

  if (emails.length === 0) {
    return [];
  }

  const results: EmailResult[] = [];
  
  // Process emails in batches to avoid rate limiting
  for (let i = 0; i < emails.length; i += concurrency) {
    const batch = emails.slice(i, i + concurrency);
    
    const batchResults = await Promise.allSettled(
      batch.map(async (email, index) => {
        // Add delay between emails to respect rate limits
        if (index > 0) {
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
        return sendEmail(email);
      })
    );

    const processedResults = batchResults.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        console.error(`Batch email ${i + index} failed:`, result.reason);
        return { 
          success: false, 
          error: result.reason?.message || 'Batch email failed' 
        };
      }
    });

    results.push(...processedResults);

    // If failFast is enabled and any email failed, stop processing
    if (failFast && processedResults.some(r => !r.success)) {
      console.warn('Batch email processing stopped due to failure (failFast enabled)');
      break;
    }

    // Add delay between batches
    if (i + concurrency < emails.length) {
      await new Promise(resolve => setTimeout(resolve, delayMs * 2));
    }
  }

  const successCount = results.filter(r => r.success).length;
  const failureCount = results.length - successCount;
  
  console.log(`Batch email completed: ${successCount} sent, ${failureCount} failed`);

  return results;
}

/**
 * Email template types for type safety
 */
export type EmailTemplate =
  | 'welcome'
  | 'purchase-receipt'
  | 'purchase-confirmation'
  | 'password-reset'
  | 'security-notification'
  | 'admin-purchase-approval'
  | 'purchase-approved'
  | 'purchase-rejected';

/**
 * Email configuration constants
 */
export const EMAIL_CONFIG = {
  FROM_ADDRESS: 'Astewai Bookstore <noreply@astewai-bookstore.com>',
  ADMIN_ADDRESS: 'admin@astewai-bookstore.com',
  SUPPORT_ADDRESS: 'support@astewai-bookstore.com',
  get SITE_URL() { return emailConfig.siteUrl; },
  RATE_LIMIT: {
    BATCH_SIZE: 5,
    DELAY_MS: 100,
    BATCH_DELAY_MS: 200,
  },
} as const;

/**
 * Email service health check with comprehensive validation
 */
export async function checkEmailServiceHealth(): Promise<{
  healthy: boolean;
  error?: string;
  details?: {
    configValid: boolean;
    clientInitialized: boolean;
    apiKeyPresent: boolean;
  };
}> {
  const details = {
    configValid: false,
    clientInitialized: false,
    apiKeyPresent: false,
  };

  try {
    // Check if configuration is valid
    const config = emailConfig.getInstance();
    details.configValid = true;

    // Check if API key is present (don't log the actual key)
    details.apiKeyPresent = !!process.env.RESEND_API_KEY;

    // Check if client can be initialized
    const client = config.getResendClient();
    details.clientInitialized = !!client;

    const allHealthy = details.configValid && details.apiKeyPresent && details.clientInitialized;

    return { 
      healthy: allHealthy,
      details,
      ...(allHealthy ? {} : { error: 'Email service configuration incomplete' })
    };
  } catch (error) {
    return { 
      healthy: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      details
    };
  }
}

/**
 * Retry configuration for email sending
 */
const RETRY_CONFIG = {
  maxAttempts: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffMultiplier: 2,
} as const;

/**
 * Determine if an error is retryable
 */
function isRetryableError(error: EmailError): boolean {
  return error.type === 'network' || 
         (error.type === 'rate_limit') ||
         (error.type === 'service' && error.code !== 'invalid_api_key');
}

/**
 * Send email with retry logic
 */
export async function sendEmailWithRetry(
  options: EmailOptions,
  retryConfig: Partial<typeof RETRY_CONFIG> = {}
): Promise<EmailResult> {
  const config = { ...RETRY_CONFIG, ...retryConfig };
  let lastError: EmailError | undefined;

  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    const result = await sendEmail(options);
    
    if (result.success) {
      if (attempt > 1) {
        console.log(`Email sent successfully on attempt ${attempt}`, {
          recipient: Array.isArray(options.to) ? options.to[0] : options.to,
          subject: options.subject,
        });
      }
      return result;
    }

    lastError = result.error;
    
    // Don't retry if error is not retryable or this is the last attempt
    if (!result.error || !isRetryableError(result.error) || attempt === config.maxAttempts) {
      break;
    }

    // Calculate delay with exponential backoff
    const delay = Math.min(
      config.baseDelay * Math.pow(config.backoffMultiplier, attempt - 1),
      config.maxDelay
    );

    // Add jitter to prevent thundering herd
    const jitteredDelay = delay + Math.random() * 1000;

    console.warn(`Email sending failed (attempt ${attempt}/${config.maxAttempts}), retrying in ${Math.round(jitteredDelay)}ms`, {
      error: result.error,
      recipient: Array.isArray(options.to) ? options.to[0] : options.to,
    });

    await new Promise(resolve => setTimeout(resolve, jitteredDelay));
  }

  return {
    success: false,
    error: lastError || { type: 'unknown', message: 'All retry attempts failed' },
    metadata: {
      timestamp: new Date(),
      recipient: Array.isArray(options.to) ? options.to[0] : options.to,
    }
  };
}

/**
 * Create email with metadata for tracking
 */
export function createEmailWithMetadata(
  options: EmailOptions,
  metadata: EmailMetadata
): EmailOptions {
  return {
    ...options,
    tags: [
      ...(options.tags || []),
      `template:${metadata.template}`,
      ...(metadata.userId ? [`user:${metadata.userId}`] : []),
      `timestamp:${metadata.timestamp.toISOString()}`,
    ],
  };
}

/**
 * Export configuration reset for testing
 */
export const __testing__ = {
  resetConfig: () => EmailConfig.reset(),
};