/**
 * Payment Service - Main orchestrator for the simplified payment system
 */

import { paymentRepository } from '@/lib/repositories/payment-repository'
import { createNotificationService } from '@/lib/services/notification-service'
import { ocrService } from '@/lib/services/ocr-service'
import { autoMatchingService } from '@/lib/services/auto-matching-service'
import type { 
  PaymentRequest, 
  PaymentRequestWithDetails,
  CreatePaymentRequestData, 
  UpdatePaymentRequestData,
  WalletConfig,
  OCRResult,
  AutoMatchResult,
  ApiResponse
} from '@/lib/types/payment'

export interface PaymentInitiationResult {
  paymentRequest: PaymentRequest
  walletConfig?: WalletConfig
  deepLinkUrl?: string
}

export interface PaymentConfirmationResult {
  success: boolean
  autoMatched: boolean
  confidence?: number
  requiresManualVerification: boolean
  message: string
}

export class PaymentService {
  /**
   * Initialize payment request
   */
  async initiatePayment(
    userId: string, 
    data: CreatePaymentRequestData
  ): Promise<ApiResponse<PaymentInitiationResult>> {
    try {
      // Check if user already has a pending request for this item
      const existingRequest = await paymentRepository.hasExistingPaymentRequest(
        userId, 
        data.item_type, 
        data.item_id
      )

      if (existingRequest.success && existingRequest.data) {
        return {
          success: false,
          error: 'You already have a pending payment request for this item'
        }
      }

      // Create payment request
      const createResult = await paymentRepository.createPaymentRequest({
        ...data,
        user_id: userId
      })

      if (!createResult.success || !createResult.data) {
        return {
          success: false,
          error: createResult.error || 'Failed to create payment request'
        }
      }

      const paymentRequest = createResult.data

      // Get wallet config if selected
      let walletConfig: WalletConfig | undefined
      let deepLinkUrl: string | undefined

      if (data.selected_wallet_id) {
        const walletsResult = await paymentRepository.getActiveWalletConfigs()
        if (walletsResult.success && walletsResult.data) {
          walletConfig = walletsResult.data.find(w => w.id === data.selected_wallet_id)
          
          if (walletConfig) {
            // Generate deep link URL
            deepLinkUrl = this.generateDeepLinkUrl(walletConfig, paymentRequest)
          }
        }
      }

      return {
        success: true,
        data: {
          paymentRequest,
          walletConfig,
          deepLinkUrl
        }
      }

    } catch (error) {
      console.error('Error in initiatePayment:', error)
      return {
        success: false,
        error: 'Failed to initiate payment'
      }
    }
  }

  /**
   * Record deep link click
   */
  async recordDeepLinkClick(paymentRequestId: string): Promise<ApiResponse<boolean>> {
    try {
      const result = await paymentRepository.updatePaymentRequest(paymentRequestId, {
        deep_link_clicked_at: new Date().toISOString(),
        status: 'payment_initiated'
      })

      if (result.success) {
        // Log the action
        await paymentRepository.addVerificationLog(
          paymentRequestId,
          'auto_match',
          'success',
          { action: 'deep_link_clicked' }
        )
      }

      return result

    } catch (error) {
      console.error('Error in recordDeepLinkClick:', error)
      return {
        success: false,
        error: 'Failed to record deep link click'
      }
    }
  }

  /**
   * Submit manual transaction ID
   */
  async submitTransactionId(
    paymentRequestId: string, 
    txId: string, 
    amount?: number
  ): Promise<ApiResponse<PaymentConfirmationResult>> {
    try {
      // Update payment request with manual data
      const updateResult = await paymentRepository.updatePaymentRequest(paymentRequestId, {
        manual_tx_id: txId,
        manual_amount: amount,
        status: 'payment_verified' // Will be updated by auto-matching if needed
      })

      if (!updateResult.success) {
        return {
          success: false,
          error: updateResult.error || 'Failed to update payment request'
        }
      }

      // Process auto-matching
      const autoMatchResult = await autoMatchingService.processAutoMatching(paymentRequestId)

      const result: PaymentConfirmationResult = {
        success: true,
        autoMatched: autoMatchResult.matched,
        confidence: autoMatchResult.confidence,
        requiresManualVerification: !autoMatchResult.matched,
        message: autoMatchResult.matched 
          ? `Payment automatically verified with ${(autoMatchResult.confidence * 100).toFixed(0)}% confidence`
          : 'Payment submitted for manual verification'
      }

      return {
        success: true,
        data: result
      }

    } catch (error) {
      console.error('Error in submitTransactionId:', error)
      return {
        success: false,
        error: 'Failed to submit transaction ID'
      }
    }
  }

  /**
   * Process uploaded receipt with OCR
   */
  async processReceiptUpload(
    paymentRequestId: string, 
    imageBuffer: Buffer
  ): Promise<ApiResponse<OCRResult & { autoMatched: boolean }>> {
    try {
      // Get payment request to get expected amount
      const paymentResult = await paymentRepository.getPaymentRequestById(paymentRequestId)
      if (!paymentResult.success || !paymentResult.data) {
        return {
          success: false,
          error: 'Payment request not found'
        }
      }

      const paymentRequest = paymentResult.data

      // Process image with OCR
      const ocrResult = await ocrService.processReceiptImage(imageBuffer, {
        extract_patterns: {
          tx_id: [
            'transaction[\\s#:]*([A-Z0-9]{8,20})',
            'ref[\\s#:]*([A-Z0-9]{8,20})',
            'reference[\\s#:]*([A-Z0-9]{8,20})',
            '([A-Z0-9]{10,20})'
          ],
          amount: [
            'amount[\\s#:]*([0-9,]+\\.[0-9]{2})',
            'total[\\s#:]*([0-9,]+\\.[0-9]{2})',
            '([0-9,]+\\.[0-9]{2})\\s*(?:ETB|birr)',
            '([0-9,]+\\.[0-9]{2})'
          ]
        }
      })

      // Update payment request with OCR results
      await paymentRepository.updatePaymentRequest(paymentRequestId, {
        ocr_processed_at: new Date().toISOString(),
        ocr_extracted_tx_id: ocrResult.extracted_tx_id,
        ocr_extracted_amount: ocrResult.extracted_amount,
        ocr_confidence_score: ocrResult.confidence_score,
        ocr_raw_text: ocrResult.raw_text
      })

      // Process auto-matching if we have extracted data
      let autoMatched = false
      if (ocrResult.extracted_tx_id || ocrResult.extracted_amount) {
        const autoMatchResult = await autoMatchingService.processAutoMatching(paymentRequestId)
        autoMatched = autoMatchResult.matched
      }

      return {
        success: true,
        data: {
          ...ocrResult,
          autoMatched
        }
      }

    } catch (error) {
      console.error('Error in processReceiptUpload:', error)
      return {
        success: false,
        error: 'Failed to process receipt upload'
      }
    }
  }

  /**
   * Admin verification of payment
   */
  async adminVerifyPayment(
    paymentRequestId: string,
    adminUserId: string,
    verificationMethod: 'manual' | 'bank_statement' | 'sms_verification',
    approve: boolean,
    notes?: string
  ): Promise<ApiResponse<boolean>> {
    try {
      const status = approve ? 'completed' : 'failed'
      
      const result = await paymentRepository.updatePaymentRequest(paymentRequestId, {
        status,
        admin_verified_at: new Date().toISOString(),
        admin_verified_by: adminUserId,
        admin_notes: notes,
        verification_method: verificationMethod
      })

      if (result.success && approve) {
        // Add item to user's library via DB RPC (security-definer)
        const grantResult = await paymentRepository.grantPurchaseToUser(paymentRequestId)
        if (!grantResult.success) {
          console.error('Failed to grant purchase via RPC:', grantResult.error)
        }

        // Send notification to user and admins
        try {
          const notificationService = createNotificationService()
          // Fetch payment and user details
          const paymentDetails = await this.getPaymentRequest(paymentRequestId)
          if (paymentDetails.success && paymentDetails.data) {
            const userEmail = paymentDetails.data.user_email
            const subject = 'Your purchase has been approved'
            const content = `Your payment for ${paymentDetails.data.item_title} has been approved and access granted. Request ID: ${paymentRequestId}`
            await notificationService.sendEmailNotification(userEmail, subject, content)
          }
        } catch (e) {
          console.error('Failed to send notification after approval:', e)
        }
      }

      // Log the verification
      await paymentRepository.addVerificationLog(
        paymentRequestId,
        'admin_verification',
        approve ? 'success' : 'failed',
        {
          verification_method: verificationMethod,
          admin_user_id: adminUserId,
          notes
        }
      )

      return result

    } catch (error) {
      console.error('Error in adminVerifyPayment:', error)
      return {
        success: false,
        error: 'Failed to verify payment'
      }
    }
  }

  /**
   * Get payment request with full details
   */
  async getPaymentRequest(paymentRequestId: string): Promise<ApiResponse<PaymentRequestWithDetails>> {
    return await paymentRepository.getPaymentRequestById(paymentRequestId)
  }

  /**
   * Get user's payment requests
   */
  async getUserPaymentRequests(userId: string, limit: number = 20): Promise<ApiResponse<PaymentRequest[]>> {
    return await paymentRepository.getUserPaymentRequests(userId, limit)
  }

  /**
   * Get active wallet configurations
   */
  async getActiveWallets(): Promise<ApiResponse<WalletConfig[]>> {
    return await paymentRepository.getActiveWalletConfigs()
  }

  /**
   * Generate deep link URL for wallet
   */
  private generateDeepLinkUrl(walletConfig: WalletConfig, paymentRequest: PaymentRequest): string {
    const { deep_link_template } = walletConfig
    
    return deep_link_template
      .replace('{amount}', paymentRequest.amount.toString())
      .replace('{reference}', paymentRequest.id)
      .replace('{currency}', paymentRequest.currency)
  }

  /**
   * Add item to user's library after successful payment
   */
  private async addItemToUserLibrary(paymentRequestId: string): Promise<void> {
    try {
      // This would typically call a database function
      // For now, we'll implement it directly
      const paymentResult = await paymentRepository.getPaymentRequestById(paymentRequestId)
      if (!paymentResult.success || !paymentResult.data) {
        throw new Error('Payment request not found')
      }

      const paymentRequest = paymentResult.data
      
      // Add to user library based on item type
      if (paymentRequest.item_type === 'book') {
        // Add single book to library
        // Implementation would go here
        console.log(`Adding book ${paymentRequest.item_id} to user ${paymentRequest.user_id} library`)
      } else if (paymentRequest.item_type === 'bundle') {
        // Add all books in bundle to library
        // Implementation would go here
        console.log(`Adding bundle ${paymentRequest.item_id} books to user ${paymentRequest.user_id} library`)
      }

    } catch (error) {
      console.error('Error adding item to user library:', error)
      throw error
    }
  }

  /**
   * Cancel payment request
   */
  async cancelPaymentRequest(paymentRequestId: string): Promise<ApiResponse<boolean>> {
    try {
      const result = await paymentRepository.updatePaymentRequest(paymentRequestId, {
        status: 'cancelled'
      })

      // Log the cancellation
      await paymentRepository.addVerificationLog(
        paymentRequestId,
        'auto_match',
        'success',
        { action: 'payment_cancelled' }
      )

      return result

    } catch (error) {
      console.error('Error in cancelPaymentRequest:', error)
      return {
        success: false,
        error: 'Failed to cancel payment request'
      }
    }
  }

  /**
   * Get payment statistics
   */
  async getPaymentStats(): Promise<ApiResponse<any>> {
    return await paymentRepository.getPaymentStats()
  }
}

// Export singleton instance
export const paymentService = new PaymentService()


