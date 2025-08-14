import type { AdminContactInfo, PurchaseRequest, ContactMethod } from '@/types';
import { BaseRepository, type RepositoryResult } from './base-repository';

/**
 * Repository for managing admin contact information and purchase requests
 * Handles CRUD operations for admin contact details and purchase request workflow
 */
export class ContactRepository extends BaseRepository {
  constructor(isClient = false) {
    super(isClient);
  }

  // Admin contact info methods
  
  /**
   * Get all active contact information for a specific admin
   * @param adminId - The UUID of the admin user
   * @returns Promise resolving to admin contact information array
   */
  async getAdminContactInfo(adminId: string): Promise<RepositoryResult<AdminContactInfo[]>> {
    try {
      const supabase = await this.getSupabaseClient();
      const { data, error } = await supabase
        .from('admin_contact_info')
        .select('*')
        .eq('admin_id', adminId)
        .eq('is_active', true)
        .order('contact_type', { ascending: true });

      if (error) {
        console.error('Error fetching admin contact info:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Unexpected error fetching admin contact info:', error);
      return { success: false, error: 'Failed to fetch admin contact info' };
    }
  }

  async getActiveAdminContacts(): Promise<RepositoryResult<AdminContactInfo[]>> {
    try {
      const supabase = await this.getSupabaseClient();
      const { data, error } = await supabase
        .from('admin_contact_info')
        .select('*')
        .eq('is_active', true)
        .order('contact_type', { ascending: true });

      if (error) {
        console.error('Error fetching active admin contacts:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Unexpected error fetching active admin contacts:', error);
      return { success: false, error: 'Failed to fetch active admin contacts' };
    }
  }

  async getPrimaryAdminContacts(): Promise<RepositoryResult<AdminContactInfo[]>> {
    try {
      const supabase = await this.getSupabaseClient();
      const { data, error } = await supabase
        .from('admin_contact_info')
        .select('*')
        .eq('is_active', true)
        .eq('is_primary', true)
        .order('contact_type', { ascending: true });

      if (error) {
        console.error('Error fetching primary admin contacts:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Unexpected error fetching primary admin contacts:', error);
      return { success: false, error: 'Failed to fetch primary admin contacts' };
    }
  }

  async createAdminContactInfo(contactInfo: Omit<AdminContactInfo, 'id' | 'created_at' | 'updated_at'>): Promise<RepositoryResult<AdminContactInfo>> {
    return this.executeQuery(
      'create admin contact info',
      async (supabase) => supabase
        .from('admin_contact_info')
        .insert(contactInfo)
        .select()
        .single()
    );
  }

  async updateAdminContactInfo(id: string, updates: Partial<AdminContactInfo>): Promise<RepositoryResult<AdminContactInfo>> {
    return this.executeQuery(
      'update admin contact info',
      async (supabase) => supabase
        .from('admin_contact_info')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
    );
  }

  async deleteAdminContactInfo(id: string): Promise<RepositoryResult<boolean>> {
    return this.executeQuery(
      'delete admin contact info',
      async (supabase) => {
        const { error } = await supabase
          .from('admin_contact_info')
          .delete()
          .eq('id', id);
        return { data: true, error };
      }
    );
  }

  // Purchase request methods
  async getPurchaseRequests(userId?: string, limit: number = 50, offset: number = 0): Promise<RepositoryResult<PurchaseRequest[]>> {
    return this.executeQuery(
      'fetch purchase requests',
      async (supabase) => {
        let query = supabase
          .from('purchase_requests')
          .select(`
            *,
            book:books(id, title, author, price, cover_image_url),
            bundle:bundles(id, title, price)
          `)
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1);

        if (userId) {
          query = query.eq('user_id', userId);
        }

        return query;
      }
    );
  }

  async getPurchaseRequestById(id: string): Promise<RepositoryResult<PurchaseRequest | null>> {
    return this.executeQuery(
      'fetch purchase request by id',
      async (supabase) => supabase
        .from('purchase_requests')
        .select(`
          *,
          book:books(id, title, author, price, cover_image_url),
          bundle:bundles(id, title, price)
        `)
        .eq('id', id)
        .single()
    );
  }

  /**
   * Batch operation to get multiple purchase requests by IDs
   */
  async getPurchaseRequestsByIds(ids: string[]): Promise<RepositoryResult<PurchaseRequest[]>> {
    if (ids.length === 0) {
      return { success: true, data: [] };
    }

    return this.executeQuery(
      'fetch purchase requests by ids',
      async (supabase) => supabase
        .from('purchase_requests')
        .select(`
          *,
          book:books(id, title, author, price, cover_image_url),
          bundle:bundles(id, title, price)
        `)
        .in('id', ids)
        .order('created_at', { ascending: false })
    );
  }

  async createPurchaseRequest(
    request: Omit<PurchaseRequest, 'id' | 'created_at' | 'updated_at' | 'status' | 'contacted_at' | 'responded_at' | 'admin_notes'>
  ): Promise<RepositoryResult<PurchaseRequest>> {
    // Input validation
    if (!request.user_id || !request.item_id || !request.item_type) {
      return { 
        success: false, 
        error: 'Missing required fields: user_id, item_id, and item_type are required',
        code: 'VALIDATION_ERROR',
        status: 400
      };
    }

    if (request.amount < 0) {
      return { 
        success: false, 
        error: 'Amount must be non-negative',
        code: 'VALIDATION_ERROR',
        status: 400
      };
    }

    return this.executeQuery(
      'create purchase request',
      async (supabase) => supabase
        .from('purchase_requests')
        .insert({
          ...request,
          status: 'pending'
        })
        .select(`
          *,
          book:books(id, title, author, price, cover_image_url),
          bundle:bundles(id, title, price)
        `)
        .single()
    );
  }

  /**
   * Update a purchase request with validation and audit trail
   * @param id - Purchase request ID
   * @param updates - Partial updates to apply
   * @returns Promise resolving to updated purchase request
   */
  async updatePurchaseRequest(id: string, updates: Partial<PurchaseRequest>): Promise<RepositoryResult<PurchaseRequest>> {
    // Security validation - prevent updating sensitive fields without proper authorization
    const restrictedFields = ['user_id', 'item_id', 'item_type', 'amount'];
    const hasRestrictedUpdates = restrictedFields.some(field => field in updates);
    
    if (hasRestrictedUpdates) {
      return {
        success: false,
        error: 'Cannot update restricted fields through this method',
        code: 'FORBIDDEN',
        status: 403
      };
    }

    return this.executeQuery(
      'update purchase request',
      async (supabase) => supabase
        .from('purchase_requests')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select(`
          *,
          book:books(id, title, author, price, cover_image_url),
          bundle:bundles(id, title, price)
        `)
        .single()
    );
  }

  async updatePurchaseRequestStatus(
    id: string, 
    status: PurchaseRequest['status'], 
    adminNotes?: string
  ): Promise<PurchaseRequest> {
    const updates: Partial<PurchaseRequest> = { status };
    
    if (adminNotes) {
      updates.admin_notes = adminNotes;
    }
    
    if (status === 'contacted') {
      updates.contacted_at = new Date().toISOString();
    } else if (status === 'approved' || status === 'rejected') {
      updates.responded_at = new Date().toISOString();
    }

    return this.updatePurchaseRequest(id, updates);
  }

  async deletePurchaseRequest(id: string): Promise<void> {
    const supabase = await this.getSupabaseClient();
    const { error } = await supabase
      .from('purchase_requests')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete purchase request: ${error.message}`);
    }
  }

  // Statistics and analytics
  async getPurchaseRequestStats(): Promise<{
    total: number;
    pending: number;
    contacted: number;
    approved: number;
    rejected: number;
    completed: number;
  }> {
    const supabase = await this.getSupabaseClient();
    const { data, error } = await supabase
      .from('purchase_requests')
      .select('status');

    if (error) {
      throw new Error(`Failed to fetch purchase request stats: ${error.message}`);
    }

    const stats = {
      total: data.length,
      pending: 0,
      contacted: 0,
      approved: 0,
      rejected: 0,
      completed: 0,
    };

    data.forEach((request) => {
      stats[request.status as keyof typeof stats]++;
    });

    return stats;
  }
}

// Export singleton instances for convenience
export const contactRepository = new ContactRepository();
export const clientContactRepository = new ContactRepository(true);