import { createClient } from '@/lib/supabase/client';
import type { AdminContactInfo, PurchaseRequest, ContactMethod } from '@/types';

export class ClientContactRepository {
  private supabase = createClient();

  // Admin contact info methods (read-only for clients)
  async getActiveAdminContacts(): Promise<AdminContactInfo[]> {
    const { data, error } = await this.supabase
      .from('admin_contact_info')
      .select('*')
      .eq('is_active', true)
      .order('contact_type', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch active admin contacts: ${error.message}`);
    }

    return data || [];
  }

  async getPrimaryAdminContacts(): Promise<AdminContactInfo[]> {
    const { data, error } = await this.supabase
      .from('admin_contact_info')
      .select('*')
      .eq('is_active', true)
      .eq('is_primary', true)
      .order('contact_type', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch primary admin contacts: ${error.message}`);
    }

    return data || [];
  }

  // Admin-only methods for managing their own contact info
  async getMyContactInfo(): Promise<AdminContactInfo[]> {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await this.supabase
      .from('admin_contact_info')
      .select('*')
      .eq('admin_id', user.id)
      .order('contact_type', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch my contact info: ${error.message}`);
    }

    return data || [];
  }

  async createMyContactInfo(contactInfo: Omit<AdminContactInfo, 'id' | 'admin_id' | 'created_at' | 'updated_at'>): Promise<AdminContactInfo> {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await this.supabase
      .from('admin_contact_info')
      .insert({
        ...contactInfo,
        admin_id: user.id
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create contact info: ${error.message}`);
    }

    return data;
  }

  async updateMyContactInfo(id: string, updates: Partial<AdminContactInfo>): Promise<AdminContactInfo> {
    const { data, error } = await this.supabase
      .from('admin_contact_info')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update contact info: ${error.message}`);
    }

    return data;
  }

  async deleteMyContactInfo(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('admin_contact_info')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete contact info: ${error.message}`);
    }
  }

  // Purchase request methods
  async getMyPurchaseRequests(): Promise<PurchaseRequest[]> {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await this.supabase
      .from('purchase_requests')
      .select(`
        *,
        book:books(id, title, author, price, cover_image_url),
        bundle:bundles(id, title, price)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch my purchase requests: ${error.message}`);
    }

    return data || [];
  }

  async getAllPurchaseRequests(): Promise<PurchaseRequest[]> {
    // This method is for admins only
    const { data, error } = await this.supabase
      .from('purchase_requests')
      .select(`
        *,
        book:books(id, title, author, price, cover_image_url),
        bundle:bundles(id, title, price)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch purchase requests: ${error.message}`);
    }

    return data || [];
  }

  async createPurchaseRequest(request: Omit<PurchaseRequest, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'status' | 'contacted_at' | 'responded_at' | 'admin_notes'>): Promise<PurchaseRequest> {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await this.supabase
      .from('purchase_requests')
      .insert({
        ...request,
        user_id: user.id,
        status: 'pending'
      })
      .select(`
        *,
        book:books(id, title, author, price, cover_image_url),
        bundle:bundles(id, title, price)
      `)
      .single();

    if (error) {
      throw new Error(`Failed to create purchase request: ${error.message}`);
    }

    return data;
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

    const { data, error } = await this.supabase
      .from('purchase_requests')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        book:books(id, title, author, price, cover_image_url),
        bundle:bundles(id, title, price)
      `)
      .single();

    if (error) {
      throw new Error(`Failed to update purchase request: ${error.message}`);
    }

    return data;
  }

  // Real-time subscriptions
  subscribeToMyPurchaseRequests(callback: (payload: any) => void) {
    return this.supabase
      .channel('my-purchase-requests')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'purchase_requests',
        },
        callback
      )
      .subscribe();
  }

  subscribeToAllPurchaseRequests(callback: (payload: any) => void) {
    return this.supabase
      .channel('all-purchase-requests')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'purchase_requests',
        },
        callback
      )
      .subscribe();
  }
}