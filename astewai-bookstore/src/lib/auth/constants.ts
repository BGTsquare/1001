/**
 * Authentication-related constants and error messages
 */

export const AUTH_ERRORS = {
  INVALID_CREDENTIALS: 'Invalid login credentials',
  EMAIL_NOT_CONFIRMED: 'Email not confirmed',
  WEAK_PASSWORD: 'Password should be at least 6 characters',
  EMAIL_ALREADY_REGISTERED: 'User already registered',
  NETWORK_ERROR: 'Network error occurred',
  UNEXPECTED_ERROR: 'An unexpected error occurred',
} as const

export const AUTH_SUCCESS_MESSAGES = {
  SIGN_UP: 'Account created successfully! Please check your email to confirm your account.',
  SIGN_IN: 'Signed in successfully',
  SIGN_OUT: 'Signed out successfully',
  PASSWORD_RESET: 'Password reset email sent successfully',
} as const

/**
 * Maps Supabase auth error messages to user-friendly messages
 */
export const mapAuthError = (error: string): string => {
  const errorLower = error.toLowerCase()
  
  if (errorLower.includes('invalid login credentials')) {
    return AUTH_ERRORS.INVALID_CREDENTIALS
  }
  
  if (errorLower.includes('email not confirmed')) {
    return AUTH_ERRORS.EMAIL_NOT_CONFIRMED
  }
  
  if (errorLower.includes('password') && errorLower.includes('6 characters')) {
    return AUTH_ERRORS.WEAK_PASSWORD
  }
  
  if (errorLower.includes('user already registered')) {
    return AUTH_ERRORS.EMAIL_ALREADY_REGISTERED
  }
  
  if (errorLower.includes('network') || errorLower.includes('fetch')) {
    return AUTH_ERRORS.NETWORK_ERROR
  }
  
  return error // Return original error if no mapping found
}