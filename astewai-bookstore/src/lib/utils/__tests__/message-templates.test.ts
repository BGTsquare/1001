import {
  generatePurchaseInquiryMessage,
  generatePurchaseRequestMessage,
  generateFollowUpMessage,
  generateThankYouMessage,
  generateCancellationMessage,
  getMessageTemplateSuggestions,
  formatMessageForContactMethod,
  validateMessageLength
} from '../message-templates';
import type { Book, Bundle, PurchaseRequest } from '@/types';

const mockBook: Book = {
  id: '1',
  title: 'Test Book',
  author: 'Test Author',
  price: 19.99,
  cover_image_url: 'https://example.com/cover.jpg',
  description: 'Test description',
  category: 'fiction',
  tags: ['test'],
  is_free: false,
  is_featured: false,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  content_url: null,
  preview_url: null,
  isbn: null,
  publication_date: null,
  page_count: null,
  language: 'en',
  file_size: null,
  format: 'pdf'
};

const mockBundle: Bundle = {
  id: '1',
  title: 'Test Bundle',
  description: 'Test bundle description',
  price: 49.99,
  cover_image_url: 'https://example.com/bundle-cover.jpg',
  is_featured: false,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z'
};

const mockPurchaseRequest: PurchaseRequest = {
  id: 'req-1',
  user_id: 'user-1',
  item_type: 'book',
  item_id: '1',
  amount: 19.99,
  preferred_contact_method: 'telegram',
  user_message: 'I need this urgently',
  status: 'pending',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  contacted_at: null,
  responded_at: null,
  admin_notes: null,
  book: mockBook
};

describe('generatePurchaseInquiryMessage', () => {
  it('generates correct message for book', () => {
    const message = generatePurchaseInquiryMessage(mockBook, 'book');
    
    expect(message).toContain('Hi! I\'m interested in purchasing the book: "Test Book" by Test Author for $19.99');
    expect(message).toContain('Please let me know how to proceed with the purchase');
    expect(message).toContain('Thank you!');
  });

  it('generates correct message for bundle', () => {
    const message = generatePurchaseInquiryMessage(mockBundle, 'bundle');
    
    expect(message).toContain('Hi! I\'m interested in purchasing the bundle: "Test Bundle" for $49.99');
    expect(message).toContain('Please let me know how to proceed with the purchase');
    expect(message).toContain('Thank you!');
  });

  it('includes user message when provided', () => {
    const message = generatePurchaseInquiryMessage(mockBook, 'book', {
      userMessage: 'I need this urgently'
    });
    
    expect(message).toContain('Additional message: I need this urgently');
  });

  it('excludes user message when includeUserMessage is false', () => {
    const message = generatePurchaseInquiryMessage(mockBook, 'book', {
      userMessage: 'I need this urgently',
      includeUserMessage: false
    });
    
    expect(message).not.toContain('Additional message: I need this urgently');
  });

  it('uses custom greeting and closing', () => {
    const message = generatePurchaseInquiryMessage(mockBook, 'book', {
      customGreeting: 'Hello there!',
      customClosing: 'Best regards!'
    });
    
    expect(message).toContain('Hello there! I\'m interested in purchasing');
    expect(message).toContain('Best regards!');
  });

  it('handles book without author', () => {
    const bookWithoutAuthor = { ...mockBook, author: '' };
    const message = generatePurchaseInquiryMessage(bookWithoutAuthor, 'book');
    
    expect(message).toContain('book: "Test Book" for $19.99');
    expect(message).not.toContain(' by Test Author');
  });
});

describe('generatePurchaseRequestMessage', () => {
  it('generates correct message for existing request', () => {
    const message = generatePurchaseRequestMessage(mockPurchaseRequest);
    
    expect(message).toContain('Hi! I\'d like to purchase the book: "Test Book" for $19.99');
    expect(message).toContain('Additional message: I need this urgently');
    expect(message).toContain('Request ID: req-1');
    expect(message).toContain('Thank you!');
  });

  it('excludes request ID when specified', () => {
    const message = generatePurchaseRequestMessage(mockPurchaseRequest, {
      includeRequestId: false
    });
    
    expect(message).not.toContain('Request ID: req-1');
  });

  it('excludes user message when specified', () => {
    const message = generatePurchaseRequestMessage(mockPurchaseRequest, {
      includeUserMessage: false
    });
    
    expect(message).not.toContain('Additional message: I need this urgently');
  });

  it('handles request without user message', () => {
    const requestWithoutMessage = { ...mockPurchaseRequest, user_message: null };
    const message = generatePurchaseRequestMessage(requestWithoutMessage);
    
    expect(message).not.toContain('Additional message:');
  });

  it('handles request with bundle', () => {
    const bundleRequest = {
      ...mockPurchaseRequest,
      item_type: 'bundle' as const,
      book: undefined,
      bundle: mockBundle
    };
    
    const message = generatePurchaseRequestMessage(bundleRequest);
    
    expect(message).toContain('bundle: "Test Bundle"');
  });

  it('handles request with unknown item', () => {
    const unknownRequest = {
      ...mockPurchaseRequest,
      book: undefined,
      bundle: undefined
    };
    
    const message = generatePurchaseRequestMessage(unknownRequest);
    
    expect(message).toContain('book: "Unknown Item"');
  });
});

describe('generateFollowUpMessage', () => {
  it('generates status inquiry message', () => {
    const message = generateFollowUpMessage(mockPurchaseRequest, 'status_inquiry');
    
    expect(message).toContain('I\'m following up on my purchase request for the book: "Test Book"');
    expect(message).toContain('Request ID: req-1');
    expect(message).toContain('Could you please provide an update on the status');
  });

  it('generates payment ready message', () => {
    const message = generateFollowUpMessage(mockPurchaseRequest, 'payment_ready');
    
    expect(message).toContain('I\'m ready to proceed with payment');
  });

  it('generates additional info message', () => {
    const message = generateFollowUpMessage(mockPurchaseRequest, 'additional_info', 'Here is more info');
    
    expect(message).toContain('I wanted to provide some additional information');
    expect(message).toContain('Here is more info');
  });

  it('generates custom message', () => {
    const message = generateFollowUpMessage(mockPurchaseRequest, 'custom', 'Custom follow-up text');
    
    expect(message).toContain('Custom follow-up text');
  });
});

describe('generateThankYouMessage', () => {
  it('generates thank you message for book', () => {
    const message = generateThankYouMessage(mockBook, 'book');
    
    expect(message).toContain('Thank you for the book "Test Book"');
    expect(message).toContain('I\'m excited to start reading');
  });

  it('generates thank you message for bundle', () => {
    const message = generateThankYouMessage(mockBundle, 'bundle');
    
    expect(message).toContain('Thank you for the bundle "Test Bundle"');
  });
});

describe('generateCancellationMessage', () => {
  it('generates cancellation message', () => {
    const message = generateCancellationMessage(mockPurchaseRequest);
    
    expect(message).toContain('I need to cancel my purchase request for the book: "Test Book"');
    expect(message).toContain('Request ID: req-1');
    expect(message).toContain('I apologize for any inconvenience');
  });

  it('includes reason when provided', () => {
    const message = generateCancellationMessage(mockPurchaseRequest, 'Found it elsewhere');
    
    expect(message).toContain('Reason: Found it elsewhere');
  });
});

describe('getMessageTemplateSuggestions', () => {
  it('returns suggestions for telegram', () => {
    const suggestions = getMessageTemplateSuggestions('telegram');
    
    expect(suggestions.greetings).toContain('Hi!');
    expect(suggestions.greetings).toContain('Hello!');
    expect(suggestions.closings).toContain('Thanks!');
  });

  it('returns suggestions for whatsapp', () => {
    const suggestions = getMessageTemplateSuggestions('whatsapp');
    
    expect(suggestions.greetings).toContain('Hi!');
    expect(suggestions.closings).toContain('Thanks!');
  });

  it('returns suggestions for email', () => {
    const suggestions = getMessageTemplateSuggestions('email');
    
    expect(suggestions.greetings).toContain('Hello,');
    expect(suggestions.greetings).toContain('Dear Admin,');
    expect(suggestions.closings).toContain('Best regards,');
  });
});

describe('formatMessageForContactMethod', () => {
  const testMessage = 'Hello, this is a test message.';

  it('returns message as-is for telegram', () => {
    const formatted = formatMessageForContactMethod(testMessage, 'telegram');
    expect(formatted).toBe(testMessage);
  });

  it('returns message as-is for whatsapp', () => {
    const formatted = formatMessageForContactMethod(testMessage, 'whatsapp');
    expect(formatted).toBe(testMessage);
  });

  it('returns message as-is for email', () => {
    const formatted = formatMessageForContactMethod(testMessage, 'email');
    expect(formatted).toBe(testMessage);
  });
});

describe('validateMessageLength', () => {
  it('validates telegram message length', () => {
    const shortMessage = 'Short message';
    const validation = validateMessageLength(shortMessage, 'telegram');
    
    expect(validation.isValid).toBe(true);
    expect(validation.maxLength).toBe(4096);
    expect(validation.currentLength).toBe(shortMessage.length);
  });

  it('invalidates telegram message that is too long', () => {
    const longMessage = 'A'.repeat(5000);
    const validation = validateMessageLength(longMessage, 'telegram');
    
    expect(validation.isValid).toBe(false);
    expect(validation.maxLength).toBe(4096);
    expect(validation.currentLength).toBe(5000);
  });

  it('validates whatsapp message length', () => {
    const message = 'WhatsApp message';
    const validation = validateMessageLength(message, 'whatsapp');
    
    expect(validation.isValid).toBe(true);
    expect(validation.maxLength).toBe(65536);
  });

  it('validates email message length', () => {
    const message = 'Email message';
    const validation = validateMessageLength(message, 'email');
    
    expect(validation.isValid).toBe(true);
    expect(validation.maxLength).toBe(10000);
  });

  it('invalidates email message that is too long', () => {
    const longMessage = 'A'.repeat(15000);
    const validation = validateMessageLength(longMessage, 'email');
    
    expect(validation.isValid).toBe(false);
    expect(validation.maxLength).toBe(10000);
    expect(validation.currentLength).toBe(15000);
  });
});