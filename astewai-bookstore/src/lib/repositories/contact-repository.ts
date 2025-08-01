import { createClient } from '@/lib/supabase/server';
import type { AdminContactInfo, PurchaseRequest, ContactMethod } from '@/types';

export class ContactRepository {
  private supabase = createClient();

  // Admin contact info methods
  async getAdminContactInfo(adminId: string): Promise<AdminContactInfo[]> {
    const { data, error } = await this.supabase
      .from('admin_contact_info')
      .select('*')
      .eq('admin_id', adminId)
      .eq('is_active', true)
      .order('contact_type', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch admin contact info: ${error.message}`);
    }

    return data || [];
  }

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

  async createAdminContactInfo(contactInfo: Omit<AdminContactInfo, 'id' | 'created_at' | 'updated_at'>): Promise<AdminContactInfo> {
    const { data, error } = await this.supabase
      .from('admin_contact_info')
      .insert(contactInfo)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create admin contact info: ${error.message}`);
    }

    return data;
  }

  async updateAdminContactInfo(id: string, updates: Partial<AdminContactInfo>): Promise<AdminContactInfo> {
    const { data, error } = await this.supabase
      .from('admin_contact_info')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update admin contact info: ${error.message}`);
    }

    return data;
  }

  async deleteAdminContactInfo(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('admin_contact_info')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete admin contact info: ${error.message}`);
    }
  }

  // Purchase request methods
  async getPurchaseRequests(userId?: string): Promise<PurchaseRequest[]> {
    let query = this.supabase
      .from('purchase_requests')
      .select(`
        *,
        book:books(id, title, author, price, cover_image_url),
        bundle:bundles(id, title, price)
      `)
      .order('created_at', { ascending: false });

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch purchase requests: ${error.message}`);
    }

    return data || [];
  }

  async getPurchaseRequestById(id: string): Promise<PurchaseRequest | null> {
    const { data, error } = await this.supabase
      .from('purchase_requests')
      .select(`
        *,
        book:books(id, title, author, price, cover_image_url),
        bundle:bundles(id, title, price)
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw new Error(`Failed to fetch purchase request: ${error.message}`);
    }

    return data;
  }

  async createPurchaseRequest(request: Omit<PurchaseRequest, 'id' | 'created_at' | 'updated_at' | 'status' | 'contacted_at' | 'responded_at' | 'admin_notes'>): Promise<PurchaseRequest> {
    const { data, error } = await this.supabase
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
      .single();

    if (error) {
      throw new Error(`Failed to create purchase request: ${error.message}`);
    }

    return data;
  }

  async updatePurchaseRequest(id: string, updates: Partial<PurchaseRequest>): Promise<PurchaseRequest> {
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
    const { error } = await this.supabase
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
    const { data, error } = await this.supabase
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