import { createClient } from '@/lib/supabase/server'
import { PURCHASE_STATUS } from '@/lib/constants/purchase-status'
import type { Result } from '@/lib/types/result'
import { success, failure } from '@/lib/types/result'
import type { TelegramPurchaseData, BasePurchaseData } from '@/lib/services/purchase-service'

export interface PurchaseEntity {
  id: string
  user_id: string
  item_type: 'book' | 'bundle'
  item_id: string
  amount: number
  amount_in_birr?: number
  initiation_token?: string
  transaction_reference?: string
  telegram_chat_id?: number
  telegram_user_id?: number
  status: string
  created_at: string
  updated_at?: string
}

export class PurchaseRepository {
  private supabase = createClient()

  async create(purchaseData: TelegramPurchaseData): Promise<Result<PurchaseEntity, string>> {
    try {
      const { data, error } = await this.supabase
        .from('purchases')
        .insert(purchaseData)
        .select()
        .single()

      if (error) {
        return failure(`Failed to create purchase: ${error.message}`)
      }

      return success(data)
    } catch (error) {
      return failure(`Database error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async findByToken(token: string): Promise<Result<PurchaseEntity | null, string>> {
    try {
      const { data, error } = await this.supabase
        .from('purchases')
        .select('*')
        .eq('initiation_token', token)
        .eq('status', PURCHASE_STATUS.PENDING_INITIATION)
        .single()

      if (error) {
        if (error.code === 'PGRST116') { // No rows returned
          return success(null)
        }
        return failure(`Failed to find purchase: ${error.message}`)
      }

      return success(data)
    } catch (error) {
      return failure(`Database error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async findPendingByChat(chatId: number): Promise<Result<PurchaseEntity | null, string>> {
    try {
      const { data, error } = await this.supabase
        .from('purchases')
        .select('*')
        .eq('telegram_chat_id', chatId)
        .eq('status', PURCHASE_STATUS.AWAITING_PAYMENT)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (error) {
        if (error.code === 'PGRST116') { // No rows returned
          return success(null)
        }
        return failure(`Failed to find pending purchase: ${error.message}`)
      }

      return success(data)
    } catch (error) {
      return failure(`Database error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async findByOrderId(orderId: string, chatId?: number): Promise<Result<PurchaseEntity | null, string>> {
    try {
      let query = this.supabase
        .from('purchases')
        .select('*')
        .eq('transaction_reference', orderId)

      if (chatId) {
        query = query.eq('telegram_chat_id', chatId)
      }

      const { data, error } = await query.single()

      if (error) {
        if (error.code === 'PGRST116') { // No rows returned
          return success(null)
        }
        return failure(`Failed to find purchase: ${error.message}`)
      }

      return success(data)
    } catch (error) {
      return failure(`Database error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async updateStatus(purchaseId: string, status: string): Promise<Result<void, string>> {
    try {
      const { error } = await this.supabase
        .from('purchases')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', purchaseId)

      if (error) {
        return failure(`Failed to update purchase status: ${error.message}`)
      }

      return success(undefined)
    } catch (error) {
      return failure(`Database error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async updateWithTelegram(
    purchaseId: string, 
    chatId: number, 
    userId: number
  ): Promise<Result<void, string>> {
    try {
      const { error } = await this.supabase
        .from('purchases')
        .update({
          telegram_chat_id: chatId,
          telegram_user_id: userId,
          status: PURCHASE_STATUS.AWAITING_PAYMENT,
          updated_at: new Date().toISOString()
        })
        .eq('id', purchaseId)

      if (error) {
        return failure(`Failed to update purchase with Telegram info: ${error.message}`)
      }

      return success(undefined)
    } catch (error) {
      return failure(`Database error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
}

// Export singleton instance for consistent usage
export const purchaseRepository = new PurchaseRepository()

