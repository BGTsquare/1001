import { createClient } from '@/lib/supabase/server'
import { PURCHASE_STATUS } from '@/lib/constants/purchase-status'

export interface PurchaseInfo {
  id: string
  itemTitle: string
  itemType: 'book' | 'bundle'
  itemId: string
  amount: number
  amountInBirr: number
  transactionReference: string
}

export interface BasePurchaseData {
  user_id: string
  item_type: 'book' | 'bundle'
  item_id: string
  amount: number
  status: string
  created_at: string
}





export class PurchaseService {
  private async getSupabaseClient() {
    return await createClient()
  }

  /**
   * Validates if an item exists and returns its details
   */
  private async validateItem(itemType: 'book' | 'bundle', itemId: string): Promise<{ success: boolean; data?: { title: string; price: number }; error?: string }> {
    try {
      const supabase = await this.getSupabaseClient()
      const table = itemType === 'book' ? 'books' : 'bundles'
      
      const { data, error } = await supabase
        .from(table)
        .select('title, price')
        .eq('id', itemId)
        .single()

      if (error || !data) {
        return { success: false, error: `${itemType} not found` }
      }

      return { success: true, data: { title: data.title, price: data.price } }
    } catch (error) {
      return { success: false, error: `Error validating ${itemType}: ${error instanceof Error ? error.message : 'Unknown error'}` }
    }
  }

  /**
   * Generates a unique transaction reference
   */
  private generateTransactionReference(): string {
    const timestamp = Date.now()
    const randomPart = this.generateSecureRandomString(9).toUpperCase()
    return `AST-${timestamp}-${randomPart}`
  }



  /**
   * Generates a cryptographically secure random string
   */
  private generateSecureRandomString(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''
    
    // Use crypto.getRandomValues for better security
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      const array = new Uint8Array(length)
      crypto.getRandomValues(array)
      for (let i = 0; i < length; i++) {
        result += chars[array[i] % chars.length]
      }
    } else {
      // Fallback for environments without crypto
      for (let i = 0; i < length; i++) {
        result += chars[Math.floor(Math.random() * chars.length)]
      }
    }
    
    return result
  }



  async getPurchaseByToken(token: string): Promise<{ purchase: PurchaseInfo; paymentOptions: PaymentOption[] } | null> {
    try {
      const supabase = await this.getSupabaseClient()
      
      // Direct database query instead of HTTP call for better performance
      const { data: purchase, error: purchaseError } = await supabase
        .from('purchases')
        .select('*')
        .eq('initiation_token', token)
        .eq('status', PURCHASE_STATUS.PENDING_INITIATION)
        .single()

      if (purchaseError || !purchase) {
        console.error('Purchase not found or expired:', purchaseError)
        return null
      }

      // Get payment options
      const { data: paymentOptions, error: paymentError } = await supabase
        .from('payment_config')
        .select('*')
        .eq('is_active', true)
        .order('created_at')

      if (paymentError) {
        console.error('Error fetching payment options:', paymentError)
        return null
      }

      // Get item title based on type
      let itemTitle = 'Unknown Item'
      if (purchase.item_type === 'book') {
        const { data: book } = await supabase
          .from('books')
          .select('title')
          .eq('id', purchase.item_id)
          .single()
        itemTitle = book?.title || 'Unknown Book'
      } else if (purchase.item_type === 'bundle') {
        const { data: bundle } = await supabase
          .from('bundles')
          .select('title')
          .eq('id', purchase.item_id)
          .single()
        itemTitle = bundle?.title || 'Unknown Bundle'
      }

      return {
        purchase: {
          id: purchase.id,
          itemId: purchase.item_id,
          itemType: purchase.item_type,
          itemTitle,
          amount: purchase.amount,
          amountInBirr: purchase.amount_in_birr || purchase.amount,
          transactionReference: purchase.transaction_reference
        },
        paymentOptions: paymentOptions?.map(option => ({
          providerName: option.provider_name,
          accountNumber: option.account_number,
          accountName: option.account_name,
          instructions: option.instructions
        })) || []
      }
    } catch (error) {
      console.error('Error fetching purchase info:', error)
      return null
    }
  }







  async updatePurchaseStatus(purchaseId: string, status: string): Promise<void> {
    const supabase = await this.getSupabaseClient()
    await supabase
      .from('purchases')
      .update({ status })
      .eq('id', purchaseId)
  }


}

// Export a singleton instance for convenience
export const purchaseService = new PurchaseService()