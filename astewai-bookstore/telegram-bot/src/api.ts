import axios from 'axios'
import { config } from './config'
import type { Purchase, PaymentConfig, ApiResponse, PurchaseFinalizationData } from './types'

class WebsiteAPI {
  private baseURL: string
  private headers: Record<string, string>

  constructor() {
    this.baseURL = config.websiteApiUrl
    this.headers = {
      'Authorization': `Bearer ${config.botSecretToken}`,
      'Content-Type': 'application/json'
    }
  }

  /**
   * Find purchase by initiation token
   */
  async findPurchaseByToken(token: string): Promise<Purchase | null> {
    try {
      // This would need to be implemented as a bot-accessible endpoint
      const response = await axios.get(`${this.baseURL}/api/purchases/find-by-token`, {
        headers: this.headers,
        params: { token }
      })

      const result: ApiResponse<Purchase> = response.data
      return result.success ? result.data || null : null
    } catch (error) {
      console.error('Error finding purchase by token:', error)
      return null
    }
  }

  /**
   * Update purchase with Telegram user data
   */
  async updateTelegramUserData(purchaseId: string, telegramData: any): Promise<boolean> {
    try {
      const response = await axios.post(`${this.baseURL}/api/purchases/update-telegram-data`, {
        purchaseId,
        telegramData
      }, { headers: this.headers })

      const result: ApiResponse = response.data
      return result.success
    } catch (error) {
      console.error('Error updating Telegram user data:', error)
      return false
    }
  }

  /**
   * Update purchase status
   */
  async updatePurchaseStatus(purchaseId: string, status: string): Promise<boolean> {
    try {
      const response = await axios.post(`${this.baseURL}/api/purchases/update-status`, {
        purchaseId,
        status
      }, { headers: this.headers })

      const result: ApiResponse = response.data
      return result.success
    } catch (error) {
      console.error('Error updating purchase status:', error)
      return false
    }
  }

  /**
   * Finalize purchase (approve or reject)
   */
  async finalizePurchase(purchaseId: string, status: 'completed' | 'rejected'): Promise<PurchaseFinalizationData | null> {
    try {
      const response = await axios.post(`${this.baseURL}/api/purchases/finalize`, {
        purchaseId,
        status
      }, { headers: this.headers })

      const result: ApiResponse<PurchaseFinalizationData> = response.data
      return result.success ? result.data || null : null
    } catch (error) {
      console.error('Error finalizing purchase:', error)
      return null
    }
  }

  /**
   * Get payment configuration
   */
  async getPaymentConfig(): Promise<PaymentConfig[]> {
    try {
      const response = await axios.get(`${this.baseURL}/api/payments/config`, {
        headers: this.headers
      })

      const result: ApiResponse<PaymentConfig[]> = response.data
      return result.success ? result.data || [] : []
    } catch (error) {
      console.error('Error getting payment config:', error)
      return []
    }
  }
}

export const websiteAPI = new WebsiteAPI()