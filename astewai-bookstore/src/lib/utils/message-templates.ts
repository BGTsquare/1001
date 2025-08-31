import type { Book, Bundle, PurchaseRequest, AdminContactInfo } from '@/types';

export interface MessageTemplateOptions {
  includeRequestId?: boolean;
  includeUserMessage?: boolean;
  customGreeting?: string;
  customClosing?: string;
}

/**
 * Generate a purchase inquiry message for books or bundles
 */
export function generatePurchaseInquiryMessage(
  item: Book | Bundle,
  itemType: 'book' | 'bundle',
  options: MessageTemplateOptions & {
    userMessage?: string;
  } = {}
): string {
  const {
    customGreeting = 'Hi!',
    customClosing = 'Thank you!',
    userMessage,
    includeUserMessage = true
  } = options;

  const itemName = item.title;
  const itemTypeText = itemType === 'book' ? 'Book' : 'Bundle';
  const authorText = 'author' in item ? ` by ${item.author}` : '';
  
  let message = `${customGreeting} I'm interested in purchasing the ${itemTypeText.toLowerCase()}: "${itemName}"${authorText} for $${item.price}.`;
  
  if (includeUserMessage && userMessage?.trim()) {
    message += `\n\nAdditional message: ${userMessage.trim()}`;
  }
  
  message += `\n\nPlease let me know how to proceed with the purchase.`;
  message += `\n\n${customClosing}`;
  
  return message;
}

/**
 * Generate a message for an existing purchase request
 */
export function generatePurchaseRequestMessage(
  request: PurchaseRequest,
  options: MessageTemplateOptions = {}
): string {
  const {
    customGreeting = 'Hi!',
    customClosing = 'Thank you!',
    includeRequestId = true,
    includeUserMessage = true
  } = options;

  const itemName = request.book?.title || request.bundle?.title || 'Unknown Item';
  const itemType = request.item_type === 'book' ? 'Book' : 'Bundle';
  
  let message = `${customGreeting} I'd like to purchase the ${itemType.toLowerCase()}: "${itemName}" for $${request.amount}.`;
  
  if (includeUserMessage && request.user_message?.trim()) {
    message += `\n\nAdditional message: ${request.user_message}`;
  }
  
  if (includeRequestId) {
    message += `\n\nRequest ID: ${request.id}`;
  }
  
  message += `\n\n${customClosing}`;
  
  return message;
}

/**
 * Generate a follow-up message for an existing purchase request
 */
export function generateFollowUpMessage(
  request: PurchaseRequest,
  followUpReason: 'status_inquiry' | 'payment_ready' | 'additional_info' | 'custom',
  customMessage?: string
): string {
  const itemName = request.book?.title || request.bundle?.title || 'Unknown Item';
  const itemType = request.item_type === 'book' ? 'book' : 'bundle';
  
  let message = `Hi! I'm following up on my purchase request for the ${itemType}: "${itemName}" (Request ID: ${request.id}).`;
  
  switch (followUpReason) {
    case 'status_inquiry':
      message += `\n\nCould you please provide an update on the status of my request?`;
      break;
    case 'payment_ready':
      message += `\n\nI'm ready to proceed with payment. Please let me know the next steps.`;
      break;
    case 'additional_info':
      message += `\n\nI wanted to provide some additional information about my request.`;
      if (customMessage?.trim()) {
        message += `\n\n${customMessage.trim()}`;
      }
      break;
    case 'custom':
      if (customMessage?.trim()) {
        message += `\n\n${customMessage.trim()}`;
      }
      break;
  }
  
  message += `\n\nThank you for your time!`;
  
  return message;
}

/**
 * Generate a thank you message after successful purchase
 */
export function generateThankYouMessage(
  item: Book | Bundle,
  itemType: 'book' | 'bundle'
): string {
  const itemName = item.title;
  const itemTypeText = itemType === 'book' ? 'book' : 'bundle';
  
  return `Thank you for the ${itemTypeText} "${itemName}"! I'm excited to start reading. Have a great day!`;
}

/**
 * Generate a cancellation message for a purchase request
 */
export function generateCancellationMessage(
  request: PurchaseRequest,
  reason?: string
): string {
  const itemName = request.book?.title || request.bundle?.title || 'Unknown Item';
  const itemType = request.item_type === 'book' ? 'book' : 'bundle';
  
  let message = `Hi! I need to cancel my purchase request for the ${itemType}: "${itemName}" (Request ID: ${request.id}).`;
  
  if (reason?.trim()) {
    message += `\n\nReason: ${reason.trim()}`;
  }
  
  message += `\n\nI apologize for any inconvenience. Thank you for your understanding!`;
  
  return message;
}

/**
 * Get message template suggestions based on contact method
 */
export function getMessageTemplateSuggestions(contactMethod: 'whatsapp' | 'email') {
  const baseTemplates = {
    greeting: {
      whatsapp: ['Hi!', 'Hello!', 'Hey!'],
      email: ['Hello,', 'Hi,', 'Dear Admin,']
    },
    closing: {
      whatsapp: ['Thanks!', 'Thank you!', 'Appreciate it!'],
      email: ['Thank you,', 'Best regards,', 'Sincerely,']
    }
  };

  return {
    greetings: baseTemplates.greeting[contactMethod],
    closings: baseTemplates.closing[contactMethod]
  };
}

/**
 * Format message for specific contact method
 */
export function formatMessageForContactMethod(
  message: string,
  contactMethod: 'telegram' | 'whatsapp' | 'email'
): string {
  switch (contactMethod) {
    case 'email':
      // For email, we might want to add a subject line indicator
      return message;
    case 'telegram':
    case 'whatsapp':
      // For messaging apps, keep it more casual and concise
      return message;
    default:
      return message;
  }
}

/**
 * Validate message length for different contact methods
 */
export function validateMessageLength(
  message: string,
  contactMethod: 'telegram' | 'whatsapp' | 'email'
): { isValid: boolean; maxLength: number; currentLength: number } {
  const limits = {
    telegram: 4096, // Telegram message limit
    whatsapp: 65536, // WhatsApp message limit (very high)
    email: 10000 // Reasonable email body limit
  };

  const maxLength = limits[contactMethod];
  const currentLength = message.length;

  return {
    isValid: currentLength <= maxLength,
    maxLength,
    currentLength
  };
}