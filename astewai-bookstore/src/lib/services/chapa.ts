/**
 * Chapa Payment Service
 * Integration with Chapa payment gateway for Ethiopian payments
 */

interface ChapaConfig {
  secretKey: string;
  publicKey: string;
  baseUrl: string;
}

interface ChapaPaymentRequest {
  amount: number;
  currency: string;
  email: string;
  first_name: string;
  last_name: string;
  phone_number?: string;
  tx_ref: string;
  callback_url: string;
  return_url: string;
  customization?: {
    title?: string;
    description?: string;
    logo?: string;
  };
}

interface ChapaPaymentResponse {
  message: string;
  status: string;
  data: {
    checkout_url: string;
  };
}

interface ChapaVerificationResponse {
  message: string;
  status: string;
  data: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    currency: string;
    amount: number;
    charge: number;
    mode: string;
    method: string;
    type: string;
    status: string;
    reference: string;
    tx_ref: string;
    customization: {
      title: string;
      description: string;
      logo: string;
    };
    meta: any;
    created_at: string;
    updated_at: string;
  };
}

class ChapaService {
  private config: ChapaConfig;

  constructor() {
    this.config = {
      secretKey: process.env.CHAPA_SECRET_KEY || '',
      publicKey: process.env.CHAPA_PUBLIC_KEY || '',
      baseUrl: process.env.CHAPA_BASE_URL || 'https://api.chapa.co/v1',
    };

    if (!this.config.secretKey) {
      throw new Error('CHAPA_SECRET_KEY is required');
    }
  }

  /**
   * Initialize a payment transaction
   */
  async initializePayment(paymentData: ChapaPaymentRequest): Promise<ChapaPaymentResponse> {
    try {
      const response = await fetch(`${this.config.baseUrl}/transaction/initialize`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.secretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Chapa API Error: ${errorData.message || 'Payment initialization failed'}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Chapa payment initialization error:', error);
      throw error;
    }
  }

  /**
   * Verify a payment transaction
   */
  async verifyPayment(txRef: string): Promise<ChapaVerificationResponse> {
    try {
      const response = await fetch(`${this.config.baseUrl}/transaction/verify/${txRef}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.secretKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Chapa API Error: ${errorData.message || 'Payment verification failed'}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Chapa payment verification error:', error);
      throw error;
    }
  }

  /**
   * Generate a unique transaction reference
   */
  generateTxRef(prefix: string = 'astewai'): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `${prefix}_${timestamp}_${random}`;
  }

  /**
   * Format amount for Chapa (Ethiopian Birr)
   */
  formatAmount(amount: number): number {
    // Chapa expects amount in ETB
    return Math.round(amount * 100) / 100;
  }
}

export const chapaService = new ChapaService();
export type { ChapaPaymentRequest, ChapaPaymentResponse, ChapaVerificationResponse };