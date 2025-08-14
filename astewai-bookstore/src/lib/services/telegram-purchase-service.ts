/**
 * Telegram Purchase Service
 * Handles Telegram bot integration for purchase information
 */

import { createClient } from '@/lib/supabase/server'
import { paymentConfigService } from './payment-config-service'
import { CurrencyConverter } from '@/lib/utils/currency'
import type { 
  TelegramPurchaseInfo, 
  DatabasePurchaseResult, 
  CurrencyConfig,
  PaymentOption 
} from '@/lib/types/telegram'
import type { ServiceResult } from '@/lib/types/payment'

export class TelegramPurchaseService {
  private readonly logger = {
    error: (message: string, error?: any) => {
      console.error(`[TelegramPurchaseService] ${message}`, error)
    },
    info: (message: string, data?: any) => {
      console.info(`[TelegramPurchaseService] ${message}`, data)
    }
  }

  /**
   * Get purchase information by initiation token
   */
  async getPurchaseInfo(token: string): Promise<ServiceResult<TelegramPurchaseInfo>> {
    try {
      if (!token || typeof token !== 'string') {
        return {
          success: false,
          error: 'Missing or invalid initiation token',
          code: 'INVALID_TOKEN'
        }
      }

      // Get purchase data from database
      const purchaseResult = await this.fetchPurchaseByToken(token)
      if (!purchaseResult.success) {
        return purchaseResult
      }

      // Get payment options
      const paymentResult = await paymentConfigService.getActivePaymentMethods()
      if (!paymentResult.success) {
        this.logger.error('Failed to fetch payment options', paymentResult.error)
        // Continue with empty payment options rather than failing
      }

      // Convert price to Ethiopian Birr
      const priceInBirr = CurrencyConverter.convertUsdToBirr(purchaseResult.data!.amount)

      // Transform payment options
      const paymentOptions: PaymentOption[] = (paymentResult.data || []).map(option => ({
        id: option.id,
        type: option.type,
        providerName: option.provider,
        accountNumber: option.accountNumber,
        accountName: option.accountName,
        instructions: option.instructions
      }))

      // Build response
      const response: TelegramPurchaseInfo = {
        purchase: {
          id: purchaseResult.data!.purchase_id,
          itemType: purchaseResult.data!.item_type,
          itemTitle: purchaseResult.data!.item_title,
          amount: purchaseResult.data!.amount,
          amountInBirr: priceInBirr,
          status: purchaseResult.data!.status,
          transactionReference: purchaseResult.data!.transaction_reference,
          user: {
            id: purchaseResult.data!.user_id,
            email: purchaseResult.data!.user_email,
            name: purchaseResult.data!.user_name
          }
        },
        paymentOptions
      }

      this.logger.info('Purchase info retrieved successfully', { 
        purchaseId: response.purchase.id,
        paymentOptionsCount: paymentOptions.length 
      })

      return {
        success: true,
        data: response
      }

    } catch (error) {
      this.logger.error('Error in getPurchaseInfo', error)
      return {
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      }
    }
  }

  /**
   * Validate bot authentication token
   */
  async validateBotAuth(authHeader: string | null): Promise<boolean> {
    try {
      if (!authHeader) {
        return false
      }

      const token = authHeader.replace('Bearer ', '')
      const expectedToken = process.env.TELEGRAM_BOT_SECRET

      if (!expectedToken) {
        this.logger.error('TELEGRAM_BOT_SECRET not configured')
        return false
      }

      return token === expectedToken
    } catch (error) {
      this.logger.error('Error validating bot auth', error)
      return false
    }
  }

  /**
   * Fetch purchase data from database using RPC function
   */
  private async fetchPurchaseByToken(token: string): Promise<ServiceResult<DatabasePurchaseResult>> {
    try {
      const supabase = await createClient()

      const { data: purchaseData, error: purchaseError } = await supabase
        .rpc('find_purchase_by_token', { token_param: token })

      if (purchaseError) {
        this.logger.error('Database error fetching purchase by token', purchaseError)
        return {
          success: false,
          error: 'Failed to fetch purchase information',
          code: 'DATABASE_ERROR'
        }
      }

      if (!purchaseData || purchaseData.length === 0) {
        return {
          success: false,
          error: 'Invalid or expired token',
          code: 'TOKEN_NOT_FOUND'
        }
      }

      return {
        success: true,
        data: purchaseData[0] as DatabasePurchaseResult
      }
    } catch (error) {
      this.logger.error('Error in fetchPurchaseByToken', error)
      return {
        success: false,
        error: 'Database connection failed',
        code: 'CONNECTION_ERROR'
      }
    }
  }

  /**
   * Get currency conversion configuration
   */
  private async getCurrencyConfig(): Promise<CurrencyConfig> {
    const rateInfo = CurrencyConverter.getCurrencyRateInfo()
    return {
      usdToBirrRate: rateInfo.rate,
      lastUpdated: rateInfo.lastUpdated.toISOString(),
      source: rateInfo.source
    }
  }

  /**
   * Update currency rate (admin function)
   * TODO: Implement rate storage in database
   */
  async updateCurrencyRate(newRate: number): Promise<ServiceResult<void>> {
    try {
      if (!CurrencyConverter.isValidRate(newRate)) {
        return {
          success: false,
          error: 'Invalid currency rate',
          code: 'INVALID_RATE'
        }
      }

      // TODO: Store in database instead of environment variable
      // For now, log the update request
      this.logger.info('Currency rate update requested', { 
        newRate, 
        currentRate: CurrencyConverter.getUsdToBirrRate() 
      })

      return {
        success: true
      }
    } catch (error) {
      this.logger.error('Error updating currency rate', error)
      return {
        success: false,
        error: 'Failed to update currency rate',
        code: 'UPDATE_FAILED'
      }
    }
  }
}

// Export singleton instance
export const telegramPurchaseService = new TelegramPurchaseService()