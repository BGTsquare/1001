import { paymentRepository, type CreatePurchaseData, type UpdatePurchaseData } from '@/lib/repositories/payment-repository'
import { bookService } from '@/lib/services/book-service'
import { bundleService } from '@/lib/services/bundle-service'
import { libraryService } from '@/lib/services/library-service'
import { chapaService } from '@/lib/services/chapa'
import type { Purchase, Book, Bundle } from '@/types'

export interface PurchaseRequest {
  userId: string
  itemType: 'book' | 'bundle'
  itemId: string
  userEmail: string
  userName: string
}

export interface PurchaseWithDetails extends Purchase {
  item?: Book | Bundle
}

export class PurchaseService {
  /**
   * Initiate a purchase for a book or bundle
   */
  async initiatePurchase(request: PurchaseRequest): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const { userId, itemType, itemId, userEmail, userName } = request

      // Verify the item exists and get its details
      let item: Book | Bundle | null = null
      let amount: number = 0

      if (itemType === 'book') {
        const bookResult = await bookService.getBookById(itemId)
        if (!bookResult.success || !bookResult.data) {
          return { success: false, error: 'Book not found' }
        }
        item = bookResult.data

        // Check if it's a free book
        if (item.is_free) {
          return { success: false, error: 'This book is free. Use the "Add to Library" option instead.' }
        }

        amount = item.price
      } else if (itemType === 'bundle') {
        const bundleResult = await bundleService.getBundleById(itemId)
        if (!bundleResult.success || !bundleResult.data) {
          return { success: false, error: 'Bundle not found' }
        }
        item = bundleResult.data
        amount = item.price
      }

      if (!item) {
        return { success: false, error: 'Item not found' }
      }

      // Check if user already has a pending/completed purchase for this item
      const existingResult = await paymentRepository.hasExistingPurchase(userId, itemType, itemId)
      if (!existingResult.success) {
        return { success: false, error: existingResult.error }
      }

      if (existingResult.data) {
        const statusMessage = {
          pending: 'You already have a pending purchase for this item',
          approved: 'You already have an approved purchase for this item',
          completed: 'You have already purchased this item'
        }[existingResult.data.status] || 'Purchase already exists'

        return { success: false, error: statusMessage }
      }

      // Generate transaction reference
      const txRef = chapaService.generateTxRef('astewai')

      // Create purchase record
      const purchaseData: CreatePurchaseData = {
        user_id: userId,
        item_type: itemType,
        item_id: itemId,
        amount,
        payment_provider_id: txRef
      }

      const createResult = await paymentRepository.createPurchase(purchaseData)
      if (!createResult.success) {
        return { success: false, error: createResult.error }
      }

      // Initialize Chapa payment
      try {
        const chapaPayment = await chapaService.initializePayment({
          amount: chapaService.formatAmount(amount),
          currency: 'ETB',
          email: userEmail,
          first_name: userName.split(' ')[0] || 'User',
          last_name: userName.split(' ').slice(1).join(' ') || '',
          tx_ref: txRef,
          callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/chapa/callback`,
          return_url: `${process.env.NEXT_PUBLIC_APP_URL}/library?purchase=success`,
          customization: {
            title: `Astewai - ${item.title}`,
            description: `Purchase ${itemType}: ${item.title}`,
            logo: `${process.env.NEXT_PUBLIC_APP_URL}/logo.png`
          }
        })

        return {
          success: true,
          data: {
            purchase: createResult.data,
            checkoutUrl: chapaPayment.data.checkout_url,
            txRef
          }
        }
      } catch (chapaError) {
        // If Chapa initialization fails, we still have the purchase record
        // but we'll return a manual approval flow
        console.error('Chapa initialization failed:', chapaError)
        
        return {
          success: true,
          data: {
            purchase: createResult.data,
            requiresManualApproval: true,
            message: 'Purchase request created. Please contact admin for payment processing.'
          }
        }
      }
    } catch (error) {
      console.error('Error in initiatePurchase:', error)
      return { success: false, error: 'Failed to initiate purchase' }
    }
  }  /**
  
 * Verify and complete a purchase after payment
   */
  async completePurchase(txRef: string): Promise<{ success: boolean; data?: Purchase; error?: string }> {
    try {
      // Get purchase by transaction reference
      const purchaseResult = await paymentRepository.getPurchaseByProviderId(txRef)
      if (!purchaseResult.success || !purchaseResult.data) {
        return { success: false, error: 'Purchase not found' }
      }

      const purchase = purchaseResult.data

      // Verify payment with Chapa
      try {
        const verification = await chapaService.verifyPayment(txRef)
        
        if (verification.data.status === 'success') {
          // Update purchase status to completed
          const updateResult = await paymentRepository.updatePurchase(purchase.id, {
            status: 'completed'
          })

          if (!updateResult.success) {
            return { success: false, error: updateResult.error }
          }

          // Add item to user's library
          await this.addPurchaseToLibrary(purchase)

          return { success: true, data: updateResult.data }
        } else {
          // Payment failed, update status
          await paymentRepository.updatePurchase(purchase.id, {
            status: 'rejected'
          })
          return { success: false, error: 'Payment verification failed' }
        }
      } catch (verificationError) {
        console.error('Payment verification failed:', verificationError)
        return { success: false, error: 'Payment verification failed' }
      }
    } catch (error) {
      console.error('Error in completePurchase:', error)
      return { success: false, error: 'Failed to complete purchase' }
    }
  }

  /**
   * Get purchase history for a user
   */
  async getUserPurchaseHistory(userId: string): Promise<{ success: boolean; data?: PurchaseWithDetails[]; error?: string }> {
    try {
      const result = await paymentRepository.getPurchasesByUserId(userId)
      if (!result.success) {
        return { success: false, error: result.error }
      }

      // Enrich purchases with item details
      const enrichedPurchases: PurchaseWithDetails[] = []
      
      for (const purchase of result.data || []) {
        let item: Book | Bundle | undefined

        if (purchase.item_type === 'book') {
          const bookResult = await bookService.getBookById(purchase.item_id)
          if (bookResult.success && bookResult.data) {
            item = bookResult.data
          }
        } else if (purchase.item_type === 'bundle') {
          const bundleResult = await bundleService.getBundleById(purchase.item_id)
          if (bundleResult.success && bundleResult.data) {
            item = bundleResult.data
          }
        }

        enrichedPurchases.push({
          ...purchase,
          item
        })
      }

      return { success: true, data: enrichedPurchases }
    } catch (error) {
      console.error('Error in getUserPurchaseHistory:', error)
      return { success: false, error: 'Failed to get purchase history' }
    }
  }

  /**
   * Approve a purchase manually (admin function)
   */
  async approvePurchase(purchaseId: string): Promise<{ success: boolean; data?: Purchase; error?: string }> {
    try {
      // Get purchase details
      const purchaseResult = await paymentRepository.getPurchaseById(purchaseId)
      if (!purchaseResult.success || !purchaseResult.data) {
        return { success: false, error: 'Purchase not found' }
      }

      const purchase = purchaseResult.data

      // Update status to approved
      const updateResult = await paymentRepository.updatePurchase(purchaseId, {
        status: 'approved'
      })

      if (!updateResult.success) {
        return { success: false, error: updateResult.error }
      }

      // Add item to user's library
      await this.addPurchaseToLibrary(purchase)

      return { success: true, data: updateResult.data }
    } catch (error) {
      console.error('Error in approvePurchase:', error)
      return { success: false, error: 'Failed to approve purchase' }
    }
  }  /*
*
   * Reject a purchase (admin function)
   */
  async rejectPurchase(purchaseId: string): Promise<{ success: boolean; data?: Purchase; error?: string }> {
    try {
      const updateResult = await paymentRepository.updatePurchase(purchaseId, {
        status: 'rejected'
      })

      if (!updateResult.success) {
        return { success: false, error: updateResult.error }
      }

      return { success: true, data: updateResult.data }
    } catch (error) {
      console.error('Error in rejectPurchase:', error)
      return { success: false, error: 'Failed to reject purchase' }
    }
  }

  /**
   * Get all purchases (admin function)
   */
  async getAllPurchases(page: number = 1, limit: number = 20): Promise<{ success: boolean; data?: PurchaseWithDetails[]; error?: string; total?: number }> {
    try {
      const result = await paymentRepository.getAllPurchases(page, limit)
      if (!result.success) {
        return { success: false, error: result.error }
      }

      // Enrich purchases with item details
      const enrichedPurchases: PurchaseWithDetails[] = []
      
      for (const purchase of result.data || []) {
        let item: Book | Bundle | undefined

        if (purchase.item_type === 'book') {
          const bookResult = await bookService.getBookById(purchase.item_id)
          if (bookResult.success && bookResult.data) {
            item = bookResult.data
          }
        } else if (purchase.item_type === 'bundle') {
          const bundleResult = await bundleService.getBundleById(purchase.item_id)
          if (bundleResult.success && bundleResult.data) {
            item = bundleResult.data
          }
        }

        enrichedPurchases.push({
          ...purchase,
          item
        })
      }

      return { success: true, data: enrichedPurchases, total: result.total }
    } catch (error) {
      console.error('Error in getAllPurchases:', error)
      return { success: false, error: 'Failed to get all purchases' }
    }
  }

  /**
   * Add purchased item to user's library
   */
  private async addPurchaseToLibrary(purchase: Purchase): Promise<void> {
    try {
      if (purchase.item_type === 'book') {
        await libraryService.addBookToLibrary(purchase.user_id, purchase.item_id)
      } else if (purchase.item_type === 'bundle') {
        // Get bundle books and add them all to library
        const bundleResult = await bundleService.getBundleById(purchase.item_id)
        if (bundleResult.success && bundleResult.data?.books) {
          for (const book of bundleResult.data.books) {
            await libraryService.addBookToLibrary(purchase.user_id, book.id)
          }
        }
      }
    } catch (error) {
      console.error('Error adding purchase to library:', error)
      // Don't throw error here as the purchase is already completed
    }
  }
}

export const purchaseService = new PurchaseService()