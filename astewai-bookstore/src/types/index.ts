// Core data types for the Astewai Digital Bookstore
import type { Database } from './database'

// Application types based on database schema
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Book = Database['public']['Tables']['books']['Row']
export type Bundle = Database['public']['Tables']['bundles']['Row'] & {
  books?: Book[]
}
export type UserLibrary = Database['public']['Tables']['user_library']['Row'] & {
  book?: Book
}
export type BlogPost = Database['public']['Tables']['blog_posts']['Row']
export type Purchase = Database['public']['Tables']['purchases']['Row']
export type Review = Database['public']['Tables']['reviews']['Row']

// Extended user type with email from auth
export interface User extends Profile {
  email: string;
}

export interface ReadingPreferences {
  fontSize?: 'small' | 'medium' | 'large';
  theme?: 'light' | 'dark' | 'sepia';
  fontFamily?: 'serif' | 'sans-serif' | 'monospace';
}

// Form types
export interface LoginForm {
  email: string;
  password: string;
}

export interface RegisterForm {
  email: string;
  password: string;
  displayName: string;
}

export interface ResetPasswordForm {
  email: string;
}

// API response types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

// Search and filter types
export interface BookFilters {
  category?: string;
  tags?: string[];
  priceRange?: [number, number];
  isFree?: boolean;
  search?: string;
}

export interface BlogFilters {
  category?: string;
  tags?: string[];
  published?: boolean;
  search?: string;
}
