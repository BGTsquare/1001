// Application constants

export const APP_NAME = 'Astewai';
export const APP_DESCRIPTION =
  'A modern digital bookstore platform for browsing, purchasing, and reading digital books online.';

export const ROUTES = {
  HOME: '/',
  BOOKS: '/books',
  BUNDLES: '/bundles',
  LIBRARY: '/library',
  BLOG: '/blog',
  CONTACT: '/contact',
  PROFILE: '/profile',
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    RESET_PASSWORD: '/auth/reset-password',
  },
  ADMIN: {
    DASHBOARD: '/admin',
    BOOKS: '/admin/books',
    BUNDLES: '/admin/bundles',
    BLOG: '/admin/blog',
    USERS: '/admin/users',
    PAYMENTS: '/admin/payments',
  },
} as const;

export const BOOK_CATEGORIES = [
  'Fiction',
  'Non-Fiction',
  'Science Fiction',
  'Fantasy',
  'Mystery',
  'Romance',
  'Biography',
  'History',
  'Technology',
  'Business',
  'Self-Help',
  'Education',
] as const;

export const READING_THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
  SEPIA: 'sepia',
} as const;

export const FONT_SIZES = {
  SMALL: 'small',
  MEDIUM: 'medium',
  LARGE: 'large',
} as const;
