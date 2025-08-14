/**
 * Currency formatting utilities for Ethiopian Birr (ETB)
 */

export const CURRENCY = {
  ETB: 'ETB',
  SYMBOL: 'ETB',
  LOCALE: 'en-ET' // Ethiopian English locale
} as const

/**
 * Formats a number as Ethiopian Birr currency
 */
export function formatETB(amount: number): string {
  return `${amount.toFixed(0)} ETB`
}

/**
 * Formats a number as Ethiopian Birr with decimal places
 */
export function formatETBWithDecimals(amount: number): string {
  return `${amount.toFixed(2)} ETB`
}

/**
 * Parses a string to a number for ETB calculations
 */
export function parseETB(value: string): number {
  const parsed = parseFloat(value)
  return isNaN(parsed) ? 0 : parsed
}

/**
 * Currency input component props
 */
export interface CurrencyInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  error?: boolean
}