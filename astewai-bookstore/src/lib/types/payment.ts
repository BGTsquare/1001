/**
 * Payment Types and Interfaces
 */

export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'refunded';

export type PaymentMethod = 'chapa' | 'manual';

export type PaymentItemType = 'book' | 'bundle';

export interface PaymentItem {
  id: string;
  type: PaymentItemType;
  title: string;
  price: number;
  quantity: number;
}

export interface PaymentRequest {
  id: string;
  user_id: string;
  items: PaymentItem[];
  total_amount: number;
  currency: string;
  payment_method: PaymentMethod;
  status: PaymentStatus;
  tx_ref?: string;
  chapa_reference?: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface CreatePaymentRequest {
  items: PaymentItem[];
  payment_method: PaymentMethod;
  user_info: {
    email: string;
    first_name: string;
    last_name: string;
    phone_number?: string;
  };
  callback_url: string;
  return_url: string;
}

export interface PaymentVerification {
  tx_ref: string;
  status: PaymentStatus;
  amount: number;
  currency: string;
  reference?: string;
  verified_at: string;
}

export interface PaymentWebhookData {
  event: string;
  data: {
    id: string;
    tx_ref: string;
    status: string;
    amount: number;
    currency: string;
    reference: string;
    first_name: string;
    last_name: string;
    email: string;
  };
}