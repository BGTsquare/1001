import { describe, it, expect } from 'vitest';
import {
  validateContactValue,
  formatContactValue,
  generateContactUrl,
  adminContactInfoSchema,
  purchaseRequestSchema,
  contactMethodDisplayNames,
  contactMethodIcons,
} from '../contact-validation';

describe('Contact Validation', () => {
  describe('validateContactValue', () => {
    it('should validate telegram usernames correctly', () => {
      expect(validateContactValue('telegram', '@validuser123').success).toBe(true);
      expect(validateContactValue('telegram', '@user_name').success).toBe(true);
      expect(validateContactValue('telegram', '@a').success).toBe(false); // too short
      expect(validateContactValue('telegram', 'invaliduser').success).toBe(false); // no @
      expect(validateContactValue('telegram', '@user-name').success).toBe(false); // invalid character
    });

    it('should validate whatsapp numbers correctly', () => {
      expect(validateContactValue('whatsapp', '+1234567890').success).toBe(true);
      expect(validateContactValue('whatsapp', '+123456789012345').success).toBe(true); // 15 digits total
      expect(validateContactValue('whatsapp', '1234567890').success).toBe(false); // no +
      expect(validateContactValue('whatsapp', '+0123456789').success).toBe(false); // starts with 0
      expect(validateContactValue('whatsapp', '+abc123').success).toBe(false); // contains letters
      expect(validateContactValue('whatsapp', '+12345678901234567890').success).toBe(false); // too long
    });

    it('should validate email addresses correctly', () => {
      expect(validateContactValue('email', 'test@example.com').success).toBe(true);
      expect(validateContactValue('email', 'user.name+tag@domain.co.uk').success).toBe(true);
      expect(validateContactValue('email', 'invalid-email').success).toBe(false);
      expect(validateContactValue('email', '@domain.com').success).toBe(false);
      expect(validateContactValue('email', 'user@').success).toBe(false);
    });

    it('should return error for invalid contact type', () => {
      const result = validateContactValue('invalid', 'test');
      expect(result.success).toBe(false);
    });
  });

  describe('formatContactValue', () => {
    it('should format telegram usernames', () => {
      expect(formatContactValue('telegram', 'username')).toBe('@username');
      expect(formatContactValue('telegram', '@username')).toBe('@username');
    });

    it('should format whatsapp numbers', () => {
      expect(formatContactValue('whatsapp', '1234567890')).toBe('+1234567890');
      expect(formatContactValue('whatsapp', '+1234567890')).toBe('+1234567890');
    });

    it('should format email addresses', () => {
      expect(formatContactValue('email', 'TEST@EXAMPLE.COM')).toBe('test@example.com');
      expect(formatContactValue('email', 'User@Domain.Com')).toBe('user@domain.com');
    });

    it('should return original value for unknown types', () => {
      expect(formatContactValue('unknown', 'test')).toBe('test');
    });
  });

  describe('generateContactUrl', () => {
    it('should generate telegram URLs correctly', () => {
      expect(generateContactUrl('telegram', '@username')).toBe('https://t.me/username');
      expect(generateContactUrl('telegram', '@username', 'Hello')).toBe('https://t.me/username?text=Hello');
    });

    it('should generate whatsapp URLs correctly', () => {
      expect(generateContactUrl('whatsapp', '+1234567890')).toBe('https://wa.me/1234567890');
      expect(generateContactUrl('whatsapp', '+1234567890', 'Hello')).toBe('https://wa.me/1234567890?text=Hello');
    });

    it('should generate email URLs correctly', () => {
      expect(generateContactUrl('email', 'test@example.com')).toBe('mailto:test@example.com');
      expect(generateContactUrl('email', 'test@example.com', 'Hello')).toBe('mailto:test@example.com?subject=Purchase Request&body=Hello');
    });

    it('should return # for unknown types', () => {
      expect(generateContactUrl('unknown', 'test')).toBe('#');
    });
  });

  describe('adminContactInfoSchema', () => {
    it('should validate valid admin contact info', () => {
      const validData = {
        contactType: 'email' as const,
        contactValue: 'admin@example.com',
        displayName: 'Admin Team',
        isActive: true,
        isPrimary: false,
      };

      const result = adminContactInfoSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid contact values', () => {
      const invalidData = {
        contactType: 'email' as const,
        contactValue: 'invalid-email',
        isActive: true,
        isPrimary: false,
      };

      const result = adminContactInfoSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should use default values', () => {
      const minimalData = {
        contactType: 'email' as const,
        contactValue: 'admin@example.com',
      };

      const result = adminContactInfoSchema.safeParse(minimalData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.isActive).toBe(true);
        expect(result.data.isPrimary).toBe(false);
      }
    });
  });

  describe('purchaseRequestSchema', () => {
    it('should validate valid purchase request', () => {
      const validData = {
        itemType: 'book' as const,
        itemId: '123e4567-e89b-12d3-a456-426614174000',
        amount: 29.99,
        preferredContactMethod: 'email' as const,
        userMessage: 'Please process my order quickly.',
      };

      const result = purchaseRequestSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid item type', () => {
      const invalidData = {
        itemType: 'invalid',
        itemId: '123e4567-e89b-12d3-a456-426614174000',
        amount: 29.99,
      };

      const result = purchaseRequestSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject invalid UUID', () => {
      const invalidData = {
        itemType: 'book' as const,
        itemId: 'invalid-uuid',
        amount: 29.99,
      };

      const result = purchaseRequestSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject negative amounts', () => {
      const invalidData = {
        itemType: 'book' as const,
        itemId: '123e4567-e89b-12d3-a456-426614174000',
        amount: -10,
      };

      const result = purchaseRequestSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject messages that are too long', () => {
      const invalidData = {
        itemType: 'book' as const,
        itemId: '123e4567-e89b-12d3-a456-426614174000',
        amount: 29.99,
        userMessage: 'a'.repeat(501), // 501 characters
      };

      const result = purchaseRequestSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('constants', () => {
    it('should have display names for all contact methods', () => {
      expect(contactMethodDisplayNames.telegram).toBe('Telegram');
      expect(contactMethodDisplayNames.whatsapp).toBe('WhatsApp');
      expect(contactMethodDisplayNames.email).toBe('Email');
    });

    it('should have icons for all contact methods', () => {
      expect(contactMethodIcons.telegram).toBe('📱');
      expect(contactMethodIcons.whatsapp).toBe('💬');
      expect(contactMethodIcons.email).toBe('📧');
    });
  });
});