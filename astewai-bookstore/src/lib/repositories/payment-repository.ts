import { createClient } from '@/lib/supabase/server'
import type { Purchase } from '@/types'

export interface CreatePurchaseData {
  user_id: string
  item_type: 'book' | 'bundle'
  item_id: string
  amount: number
  status?: 'pending_initiation' | 'awaiting_payment' | 'pending_verification' | 'completed' | 'rejected' | 'pending' | 'approved'
  transaction_reference?: string
  payment_provider_id?: string
  initiation_token?: string
  telegram_chat_id?: number
  telegram_user_id?: number
}

export interface UpdatePurchaseData {
  status?: 'pending_initiation' | 'awaiting_payment' | 'pending_verification' | 'completed' | 'rejected' | 'pending' | 'approved'
  transaction_reference?: string
  payment_provider_id?: string
  telegram_chat_id?: number
  telegram_user_id?: number
}

// Generic result type for consistent error handling
export interface RepositoryResult<T> {
  success: boolean
  data?: T
  error?: string
}

export interface PaginatedResult<T> extends RepositoryResult<T[]> {
  total?: number
  page?: number
  limit?: number
}

export class PaymentRepository {
  private supabase: any
  private isClient: boolean

  constructor(isClient = false) {
    this.isClient = isClient
    if (isClient) {
      const { createClient: createClientClient } = require('@/lib/supabase/client')
      this.supabase = createClientClient()
    } else {
      // For server-side, we'll initialize lazily to avoid import issues
      this.supabase = null
    }
  }

  private async getSupabaseClient() {
    if (this.isClient) {
      return this.supabase
    } else {
      // Always create a fresh server client to avoid stale connections
      const { createClient } = await import('@/lib/supabase/server')
      return await createClient()
    }
  }

  /**
   * Create a new purchase record
   */
  async createPurchase(data: CreatePurchaseData): Promise<RepositoryResult<Purchase>> {
    try {
      const supabase = await this.getSupabaseClient()
      
      const { data: purchase, error } = await supabase
        .from('purchases')
        .insert({
          user_id: data.user_id,
          item_type: data.item_type,
          item_id: data.item_id,
          amount: data.amount,
          payment_provider_id: data.payment_provider_id,
          transaction_reference: data.transaction_reference,
          initiation_token: data.initiation_token,
          telegram_chat_id: data.telegram_chat_id,
          telegram_user_id: data.telegram_user_id,
          status: data.status || 'pending'
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating purchase:', error)
        return { success: false, error: error.message }
      }

      return { success: true, data: purchase }
    } catch (error) {
      console.error('Error in createPurchase:', error)
      return { success: false, error: 'Failed to create purchase' }
    }
  }

  /**
   * Get purchase by ID
   */
  async getPurchaseById(id: string): Promise<RepositoryResult<Purchase>> {
    try {
      const supabase = await this.getSupabaseClient()
      
      const { data: purchase, error } = await supabase
        .from('purchases')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        console.error('Error fetching purchase:', error)
        return { success: false, error: error.message }
      }

      return { success: true, data: purchase }
    } catch (error) {
      console.error('Error in getPurchaseById:', error)
      return { success: false, error: 'Failed to fetch purchase' }
    }
  }

  /**
   * Get purchases by user ID
   */
  async getPurchasesByUserId(userId: string): Promise<RepositoryResult<Purchase[]>> {
    try {
      const supabase = await this.getSupabaseClient()
      
      const { data: purchases, error } = await supabase
        .from('purchases')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching user purchases:', error)
        return { success: false, error: error.message }
      }

      return { success: true, data: purchases || [] }
    } catch (error) {
      console.error('Error in getPurchasesByUserId:', error)
      return { success: false, error: 'Failed to fetch user purchases' }
    }
  }

  /**
   * Update purchase status and details
   */
  async updatePurchase(id: string, data: UpdatePurchaseData): Promise<RepositoryResult<Purchase>> {
    try {
      const supabase = await this.getSupabaseClient()
      
      const updateData: any = {
        ...data,
        updated_at: new Date().toISOString()
      }

      const { data: purchase, error } = await supabase
        .from('purchases')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Error updating purchase:', error)
        return { success: false, error: error.message }
      }

      return { success: true, data: purchase }
    } catch (error) {
      console.error('Error in updatePurchase:', error)
      return { success: false, error: 'Failed to update purchase' }
    }
  }

  /**
   * Update purchase with optimistic locking to prevent race conditions
   */
  async updatePurchaseWithVersionCheck(
    id: string, 
    data: UpdatePurchaseData, 
    expectedUpdatedAt: string
  ): Promise<RepositoryResult<Purchase>> {
    try {
      const supabase = await this.getSupabaseClient()
      
      const updateData: any = {
        ...data,
        updated_at: new Date().toISOString()
      }

      const { data: purchase, error } = await supabase
        .from('purchases')
        .update(updateData)
        .eq('id', id)
        .eq('updated_at', expectedUpdatedAt) // Optimistic locking
        .select()
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return { success: false, error: 'Purchase was modified by another process. Please refresh and try again.' }
        }
        console.error('Error updating purchase with version check:', error)
        return { success: false, error: error.message }
      }

      return { success: true, data: purchase }
    } catch (error) {
      console.error('Error in updatePurchaseWithVersionCheck:', error)
      return { success: false, error: 'Failed to update purchase' }
    }
  }

  /**
   * Check if user has existing purchase for item
   */
  async hasExistingPurchase(userId: string, itemType: 'book' | 'bundle', itemId: string): Promise<RepositoryResult<Purchase | null>> {
    try {
      const supabase = await this.getSupabaseClient()
      
      const { data: purchase, error } = await supabase
        .from('purchases')
        .select('*')
        .eq('user_id', userId)
        .eq('item_type', itemType)
        .eq('item_id', itemId)
        .in('status', ['pending', 'pending_initiation', 'awaiting_payment', 'pending_verification', 'completed'])
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        console.error('Error checking existing purchase:', error)
        return { success: false, error: error.message }
      }

      return { success: true, data: purchase || null }
    } catch (error) {
      console.error('Error in hasExistingPurchase:', error)
      return { success: false, error: 'Failed to check existing purchase' }
    }
  }

  /**
   * Get purchase by payment provider ID
   */
  async getPurchaseByProviderId(providerId: string): Promise<RepositoryResult<Purchase>> {
    try {
      const supabase = await this.getSupabaseClient()
      
      const { data: purchase, error } = await supabase
        .from('purchases')
        .select('*')
        .eq('payment_provider_id', providerId)
        .single()

      if (error) {
        console.error('Error fetching purchase by provider ID:', error)
        return { success: false, error: error.message }
      }

      return { success: true, data: purchase }
    } catch (error) {
      console.error('Error in getPurchaseByProviderId:', error)
      return { success: false, error: 'Failed to fetch purchase by provider ID' }
    }
  }

  /**
   * Get purchase by transaction reference (for manual payment tracking)
   */
  async getPurchaseByTransactionReference(transactionReference: string): Promise<RepositoryResult<Purchase>> {
    try {
      const supabase = await this.getSupabaseClient()
      
      const { data: purchase, error } = await supabase
        .from('purchases')
        .select('*')
        .eq('transaction_reference', transactionReference)
        .single()

      if (error) {
        console.error('Error fetching purchase by transaction reference:', error)
        return { success: false, error: error.message }
      }

      return { success: true, data: purchase }
    } catch (error) {
      console.error('Error in getPurchaseByTransactionReference:', error)
      return { success: false, error: 'Failed to fetch purchase by transaction reference' }
    }
  }

  /**
   * Find purchase by initiation token (for Telegram bot)
   */
  async findPurchaseByToken(token: string): Promise<RepositoryResult<Purchase>> {
    try {
      const supabase = await this.getSupabaseClient()
      
      const { data: purchase, error } = await supabase
        .from('purchases')
        .select('*')
        .eq('initiation_token', token)
        .single()

      if (error) {
        console.error('Error fetching purchase by token:', error)
        return { success: false, error: error.message }
      }

      return { success: true, data: purchase }
    } catch (error) {
      console.error('Error in findPurchaseByToken:', error)
      return { success: false, error: 'Failed to fetch purchase by token' }
    }
  }

  /**
   * Get user by ID (for Telegram bot responses)
   */
  async getUserById(userId: string): Promise<RepositoryResult<{ email: string, display_name?: string }>> {
    try {
      const supabase = await this.getSupabaseClient()
      
      // Get user from auth.users and profile
      const { data: user, error: userError } = await supabase.auth.admin.getUserById(userId)
      
      if (userError) {
        console.error('Error fetching user:', userError)
        return { success: false, error: userError.message }
      }

      // Get profile for display name
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', userId)
        .single()

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Error fetching profile:', profileError)
      }

      return { 
        success: true, 
        data: { 
          email: user.user?.email || 'Unknown',
          display_name: profile?.display_name 
        } 
      }
    } catch (error) {
      console.error('Error in getUserById:', error)
      return { success: false, error: 'Failed to fetch user' }
    }
  }

  /**
   * Get all purchases with pagination (admin use)
   */
  async getAllPurchases(page: number = 1, limit: number = 20): Promise<PaginatedResult<Purchase>> {
    try {
      const supabase = await this.getSupabaseClient()
      const offset = (page - 1) * limit

      // Get total count
      const { count, error: countError } = await supabase
        .from('purchases')
        .select('*', { count: 'exact', head: true })

      if (countError) {
        console.error('Error counting purchases:', countError)
        return { success: false, error: countError.message }
      }

      // Get purchases with pagination
      const { data: purchases, error } = await supabase
        .from('purchases')
        .select('*')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) {
        console.error('Error fetching all purchases:', error)
        return { success: false, error: error.message }
      }

      return { 
        success: true, 
        data: purchases || [], 
        total: count || 0,
        page,
        limit
      }
    } catch (error) {
      console.error('Error in getAllPurchases:', error)
      return { success: false, error: 'Failed to fetch all purchases' }
    }
  }

  /**
   * Get purchases by status with pagination
   */
  async getPurchasesByStatus(
    status: 'pending' | 'approved' | 'rejected' | 'completed',
    page: number = 1,
    limit: number = 20
  ): Promise<PaginatedResult<Purchase>> {
    try {
      const supabase = await this.getSupabaseClient()
      const offset = (page - 1) * limit

      // Get total count
      const { count, error: countError } = await supabase
        .from('purchases')
        .select('*', { count: 'exact', head: true })
        .eq('status', status)

      if (countError) {
        console.error('Error counting purchases by status:', countError)
        return { success: false, error: countError.message }
      }

      // Get purchases with pagination
      const { data: purchases, error } = await supabase
        .from('purchases')
        .select('*')
        .eq('status', status)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) {
        console.error('Error fetching purchases by status:', error)
        return { success: false, error: error.message }
      }

      return { 
        success: true, 
        data: purchases || [], 
        total: count || 0,
        page,
        limit
      }
    } catch (error) {
      console.error('Error in getPurchasesByStatus:', error)
      return { success: false, error: 'Failed to fetch purchases by status' }
    }
  }

  /**
   * Get purchase count by status (for admin dashboard)
   */
  async getPurchaseCountByStatus(): Promise<RepositoryResult<Record<string, number>>> {
    try {
      const supabase = await this.getSupabaseClient()
      
      const { data: purchases, error } = await supabase
        .from('purchases')
        .select('status')

      if (error) {
        console.error('Error fetching purchase counts:', error)
        return { success: false, error: error.message }
      }

      const counts = purchases?.reduce((acc, purchase) => {
        acc[purchase.status] = (acc[purchase.status] || 0) + 1
        return acc
      }, {} as Record<string, number>) || {}

      return { success: true, data: counts }
    } catch (error) {
      console.error('Error in getPurchaseCountByStatus:', error)
      return { success: false, error: 'Failed to fetch purchase counts' }
    }
  }

  /**
   * Check if purchase exists by ID
   */
  async exists(id: string): Promise<boolean> {
    const result = await this.getPurchaseById(id)
    return result.success && !!result.data
  }

  /**
   * Delete a purchase (admin only - use with caution)
   */
  async deletePurchase(id: string): Promise<RepositoryResult<boolean>> {
    try {
      const supabase = await this.getSupabaseClient()
      
      const { error } = await supabase
        .from('purchases')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Error deleting purchase:', error)
        return { success: false, error: error.message }
      }

      return { success: true, data: true }
    } catch (error) {
      console.error('Error in deletePurchase:', error)
      return { success: false, error: 'Failed to delete purchase' }
    }
  }
}

// Export singleton instances for convenience
export const paymentRepository = new PaymentRepository()
export const clientPaymentRepository = new PaymentRepository(true)