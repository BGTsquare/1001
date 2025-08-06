import { createClient } from '@/lib/supabase/server'
import type { Purchase } from '@/types'

export interface CreatePurchaseData {
  user_id: string
  item_type: 'book' | 'bundle'
  item_id: string
  amount: number
  payment_provider_id?: string
}

export interface UpdatePurchaseData {
  status?: 'pending' | 'approved' | 'rejected' | 'completed'
  payment_provider_id?: string
}

export class PaymentRepository {
  private supabase = createClient()

  /**
   * Create a new purchase record
   */
  async createPurchase(data: CreatePurchaseData): Promise<{ success: boolean; data?: Purchase; error?: string }> {
    try {
      const supabase = await this.supabase
      
      const { data: purchase, error } = await supabase
        .from('purchases')
        .insert({
          user_id: data.user_id,
          item_type: data.item_type,
          item_id: data.item_id,
          amount: data.amount,
          payment_provider_id: data.payment_provider_id,
          status: 'pending'
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
  async getPurchaseById(id: string): Promise<{ success: boolean; data?: Purchase; error?: string }> {
    try {
      const supabase = await this.supabase
      
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
  async getPurchasesByUserId(userId: string): Promise<{ success: boolean; data?: Purchase[]; error?: string }> {
    try {
      const supabase = await this.supabase
      
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
  }  /**
  
 * Update purchase status and details
   */
  async updatePurchase(id: string, data: UpdatePurchaseData): Promise<{ success: boolean; data?: Purchase; error?: string }> {
    try {
      const supabase = await this.supabase
      
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
   * Check if user has existing purchase for item
   */
  async hasExistingPurchase(userId: string, itemType: 'book' | 'bundle', itemId: string): Promise<{ success: boolean; data?: Purchase; error?: string }> {
    try {
      const supabase = await this.supabase
      
      const { data: purchase, error } = await supabase
        .from('purchases')
        .select('*')
        .eq('user_id', userId)
        .eq('item_type', itemType)
        .eq('item_id', itemId)
        .in('status', ['pending', 'approved', 'completed'])
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        console.error('Error checking existing purchase:', error)
        return { success: false, error: error.message }
      }

      return { success: true, data: purchase || undefined }
    } catch (error) {
      console.error('Error in hasExistingPurchase:', error)
      return { success: false, error: 'Failed to check existing purchase' }
    }
  }  /**
   
* Get purchase by payment provider ID
   */
  async getPurchaseByProviderId(providerId: string): Promise<{ success: boolean; data?: Purchase; error?: string }> {
    try {
      const supabase = await this.supabase
      
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
   * Get all purchases with pagination (admin use)
   */
  async getAllPurchases(page: number = 1, limit: number = 20): Promise<{ success: boolean; data?: Purchase[]; error?: string; total?: number }> {
    try {
      const supabase = await this.supabase
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

      return { success: true, data: purchases || [], total: count || 0 }
    } catch (error) {
      console.error('Error in getAllPurchases:', error)
      return { success: false, error: 'Failed to fetch all purchases' }
    }
  }
}

export const paymentRepository = new PaymentRepository()