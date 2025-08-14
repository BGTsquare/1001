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
export type AdminContactInfo = Database['public']['Tables']['admin_contact_info']['Row']
export type PaymentConfig = Database['public']['Tables']['payment_config']['Row']
export type PurchaseRequest = Database['public']['Tables']['purchase_requests']['Row'] & {
  book?: Book
  bundle?: Bundle
}

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

// Service result types for consistent error handling
export interface ServiceResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  status?: number;
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

// Contact system types
export type ContactMethod = 'telegram' | 'whatsapp' | 'email';

export interface ContactInfo {
  type: ContactMethod;
  value: string;
  displayName?: string;
  isActive: boolean;
  isPrimary: boolean;
}

export interface PurchaseRequestForm {
  itemType: 'book' | 'bundle';
  itemId: string;
  amount: number;
  preferredContactMethod?: ContactMethod;
  userMessage?: string;
}

export interface AdminContactForm {
  contactType: ContactMethod;
  contactValue: string;
  displayName?: string;
  isActive: boolean;
  isPrimary: boolean;
}
