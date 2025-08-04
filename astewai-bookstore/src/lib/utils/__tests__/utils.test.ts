import { describe, it, expect } from 'vitest'
import { cn, formatPrice, formatDate, truncateText, generateSlug } from '../utils'

describe('Utility Functions', () => {
  describe('cn (className utility)', () => {
    it('merges class names correctly', () => {
      expect(cn('class1', 'class2')).toBe('class1 class2')
    })

    it('handles conditional classes', () => {
      expect(cn('base', true && 'conditional', false && 'hidden')).toBe('base conditional')
    })

    it('handles Tailwind class conflicts', () => {
      expect(cn('p-4', 'p-2')).toBe('p-2') // Later class should override
    })

    it('handles undefined and null values', () => {
      expect(cn('base', undefined, null, 'end')).toBe('base end')
    })

    it('handles arrays of classes', () => {
      expect(cn(['class1', 'class2'], 'class3')).toBe('class1 class2 class3')
    })
  })

  describe('formatPrice', () => {
    it('formats price with currency symbol', () => {
      expect(formatPrice(19.99)).toBe('$19.99')
      expect(formatPrice(0)).toBe('$0.00')
      expect(formatPrice(1000)).toBe('$1,000.00')
    })

    it('handles different currencies', () => {
      expect(formatPrice(19.99, 'EUR')).toBe('€19.99')
      expect(formatPrice(19.99, 'GBP')).toBe('£19.99')
    })

    it('handles free pricing', () => {
      expect(formatPrice(0, 'USD', true)).toBe('Free')
    })

    it('handles invalid inputs', () => {
      expect(formatPrice(NaN)).toBe('$0.00')
      expect(formatPrice(-10)).toBe('$0.00')
    })
  })

  describe('formatDate', () => {
    it('formats date in default format', () => {
      const date = new Date('2024-01-15T10:30:00Z')
      expect(formatDate(date)).toBe('January 15, 2024')
    })

    it('formats date with custom format', () => {
      const date = new Date('2024-01-15T10:30:00Z')
      expect(formatDate(date, 'short')).toBe('Jan 15, 2024')
      expect(formatDate(date, 'numeric')).toBe('1/15/2024')
    })

    it('handles ISO string input', () => {
      const isoString = '2024-01-15T10:30:00Z'
      expect(formatDate(isoString)).toBe('January 15, 2024')
    })

    it('handles invalid dates', () => {
      expect(formatDate('invalid-date')).toBe('Invalid Date')
      expect(formatDate(null as any)).toBe('Invalid Date')
    })

    it('formats relative time', () => {
      const now = new Date()
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
      
      expect(formatDate(yesterday, 'relative')).toContain('ago')
    })
  })

  describe('truncateText', () => {
    it('truncates text to specified length', () => {
      const text = 'This is a very long text that should be truncated'
      expect(truncateText(text, 20)).toBe('This is a very long...')
    })

    it('does not truncate short text', () => {
      const text = 'Short text'
      expect(truncateText(text, 20)).toBe('Short text')
    })

    it('handles custom ellipsis', () => {
      const text = 'This is a long text'
      expect(truncateText(text, 10, ' [more]')).toBe('This is a [more]')
    })

    it('handles edge cases', () => {
      expect(truncateText('', 10)).toBe('')
      expect(truncateText('Text', 0)).toBe('...')
      expect(truncateText(null as any, 10)).toBe('')
    })

    it('truncates at word boundaries', () => {
      const text = 'This is a very long sentence'
      expect(truncateText(text, 15, '...', true)).toBe('This is a very...')
    })
  })

  describe('generateSlug', () => {
    it('generates URL-friendly slugs', () => {
      expect(generateSlug('Hello World')).toBe('hello-world')
      expect(generateSlug('The Great Adventure')).toBe('the-great-adventure')
    })

    it('handles special characters', () => {
      expect(generateSlug('Hello, World!')).toBe('hello-world')
      expect(generateSlug('Book #1: The Beginning')).toBe('book-1-the-beginning')
    })

    it('handles multiple spaces and hyphens', () => {
      expect(generateSlug('Multiple   Spaces')).toBe('multiple-spaces')
      expect(generateSlug('Already-Has-Hyphens')).toBe('already-has-hyphens')
    })

    it('handles unicode characters', () => {
      expect(generateSlug('Café & Restaurant')).toBe('cafe-restaurant')
      expect(generateSlug('Naïve Résumé')).toBe('naive-resume')
    })

    it('handles empty and invalid inputs', () => {
      expect(generateSlug('')).toBe('')
      expect(generateSlug('   ')).toBe('')
      expect(generateSlug(null as any)).toBe('')
    })

    it('limits slug length', () => {
      const longText = 'This is a very long title that should be truncated to a reasonable length'
      const slug = generateSlug(longText, 30)
      expect(slug.length).toBeLessThanOrEqual(30)
      expect(slug).not.toEndWith('-')
    })
  })

  describe('validation utilities', () => {
    it('validates email addresses', () => {
      const { isValidEmail } = require('../utils')
      
      expect(isValidEmail('test@example.com')).toBe(true)
      expect(isValidEmail('user.name+tag@domain.co.uk')).toBe(true)
      expect(isValidEmail('invalid-email')).toBe(false)
      expect(isValidEmail('test@')).toBe(false)
      expect(isValidEmail('@example.com')).toBe(false)
    })

    it('validates passwords', () => {
      const { isValidPassword } = require('../utils')
      
      expect(isValidPassword('StrongPass123!')).toBe(true)
      expect(isValidPassword('weak')).toBe(false)
      expect(isValidPassword('NoNumbers!')).toBe(false)
      expect(isValidPassword('nonumbers123')).toBe(false)
    })

    it('validates URLs', () => {
      const { isValidUrl } = require('../utils')
      
      expect(isValidUrl('https://example.com')).toBe(true)
      expect(isValidUrl('http://localhost:3000')).toBe(true)
      expect(isValidUrl('ftp://files.example.com')).toBe(true)
      expect(isValidUrl('not-a-url')).toBe(false)
      expect(isValidUrl('javascript:alert(1)')).toBe(false)
    })
  })

  describe('array utilities', () => {
    it('removes duplicates from arrays', () => {
      const { uniqueArray } = require('../utils')
      
      expect(uniqueArray([1, 2, 2, 3, 3, 3])).toEqual([1, 2, 3])
      expect(uniqueArray(['a', 'b', 'a', 'c'])).toEqual(['a', 'b', 'c'])
    })

    it('chunks arrays into smaller arrays', () => {
      const { chunkArray } = require('../utils')
      
      expect(chunkArray([1, 2, 3, 4, 5, 6], 2)).toEqual([[1, 2], [3, 4], [5, 6]])
      expect(chunkArray([1, 2, 3, 4, 5], 3)).toEqual([[1, 2, 3], [4, 5]])
    })

    it('shuffles arrays randomly', () => {
      const { shuffleArray } = require('../utils')
      
      const original = [1, 2, 3, 4, 5]
      const shuffled = shuffleArray([...original])
      
      expect(shuffled).toHaveLength(original.length)
      expect(shuffled.sort()).toEqual(original.sort())
    })
  })

  describe('object utilities', () => {
    it('deep clones objects', () => {
      const { deepClone } = require('../utils')
      
      const original = { a: 1, b: { c: 2, d: [3, 4] } }
      const cloned = deepClone(original)
      
      expect(cloned).toEqual(original)
      expect(cloned).not.toBe(original)
      expect(cloned.b).not.toBe(original.b)
    })

    it('merges objects deeply', () => {
      const { deepMerge } = require('../utils')
      
      const obj1 = { a: 1, b: { c: 2 } }
      const obj2 = { b: { d: 3 }, e: 4 }
      
      expect(deepMerge(obj1, obj2)).toEqual({
        a: 1,
        b: { c: 2, d: 3 },
        e: 4
      })
    })

    it('picks specific properties from objects', () => {
      const { pick } = require('../utils')
      
      const obj = { a: 1, b: 2, c: 3, d: 4 }
      expect(pick(obj, ['a', 'c'])).toEqual({ a: 1, c: 3 })
    })

    it('omits specific properties from objects', () => {
      const { omit } = require('../utils')
      
      const obj = { a: 1, b: 2, c: 3, d: 4 }
      expect(omit(obj, ['b', 'd'])).toEqual({ a: 1, c: 3 })
    })
  })

  describe('debounce and throttle', () => {
    it('debounces function calls', async () => {
      const { debounce } = require('../utils')
      
      let callCount = 0
      const debouncedFn = debounce(() => callCount++, 100)
      
      debouncedFn()
      debouncedFn()
      debouncedFn()
      
      expect(callCount).toBe(0)
      
      await new Promise(resolve => setTimeout(resolve, 150))
      expect(callCount).toBe(1)
    })

    it('throttles function calls', async () => {
      const { throttle } = require('../utils')
      
      let callCount = 0
      const throttledFn = throttle(() => callCount++, 100)
      
      throttledFn()
      throttledFn()
      throttledFn()
      
      expect(callCount).toBe(1)
      
      await new Promise(resolve => setTimeout(resolve, 150))
      throttledFn()
      expect(callCount).toBe(2)
    })
  })
})