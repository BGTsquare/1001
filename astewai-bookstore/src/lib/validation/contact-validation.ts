import { z } from 'zod';

// Contact method validation
export const contactMethodSchema = z.enum(['whatsapp', 'email']);

// WhatsApp phone number validation (international format)
const whatsappSchema = z.string()
  .min(1, 'WhatsApp number is required')
  .regex(/^\+[1-9]\d{7,14}$/, 'Invalid WhatsApp number format (e.g., +1234567890)');

// Email validation
const emailSchema = z.string()
  .min(1, 'Email is required')
  .email('Invalid email format');

// Contact value validation based on type
export const validateContactValue = (type: string, value: string) => {
  switch (type) {
    case 'telegram':
      return telegramSchema.safeParse(value);
    case 'whatsapp':
      return whatsappSchema.safeParse(value);
    case 'email':
      return emailSchema.safeParse(value);
    default:
      return { success: false, error: { message: 'Invalid contact type' } };
  }
};

// Admin contact info schema
export const adminContactInfoSchema = z.object({
  contactType: contactMethodSchema,
  contactValue: z.string().min(1, 'Contact value is required'),
  displayName: z.string().optional(),
  isActive: z.boolean().default(true),
  isPrimary: z.boolean().default(false),
}).refine((data) => {
  const validation = validateContactValue(data.contactType, data.contactValue);
  return validation.success;
}, {
  message: 'Invalid contact value format',
  path: ['contactValue'],
});

// Purchase request schema
export const purchaseRequestSchema = z.object({
  itemType: z.enum(['book', 'bundle']),
  itemId: z.string().uuid('Invalid item ID'),
  amount: z.number().min(0, 'Amount must be non-negative'),
  preferredContactMethod: contactMethodSchema.optional(),
  userMessage: z.string().max(500, 'Message must be 500 characters or less').optional(),
});

// Contact display formatting functions
export const formatContactValue = (type: string, value: string): string => {
  switch (type) {
    case 'telegram':
      return value.startsWith('@') ? value : `@${value}`;
    case 'whatsapp':
      return value.startsWith('+') ? value : `+${value}`;
    case 'email':
      return value.toLowerCase();
    default:
      return value;
  }
};

// Generate contact URL for direct communication
export const generateContactUrl = (type: string, value: string, message?: string): string => {
  const encodedMessage = message ? encodeURIComponent(message) : '';
  
  switch (type) {
    case 'whatsapp':
      const phoneNumber = value.replace(/[^\d]/g, '');
      return `https://wa.me/${phoneNumber}${message ? `?text=${encodedMessage}` : ''}`;
    case 'email':
      return `mailto:${value}${message ? `?subject=Purchase Request&body=${encodedMessage}` : ''}`;
    default:
      return '#';
  }
};

// Contact method display names
export const contactMethodDisplayNames: Record<string, string> = {
  telegram: 'Telegram',
  whatsapp: 'WhatsApp',
  email: 'Email',
};

// Contact method icons (for UI components)
export const contactMethodIcons: Record<string, string> = {
  telegram: '📱',
  whatsapp: '💬',
  email: '📧',
};