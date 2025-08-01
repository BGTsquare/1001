import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ContactRepository } from '../contact-repository';
import type { AdminContactInfo, PurchaseRequest } from '@/types';

// Mock Supabase client
const mockQuery = {
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  single: vi.fn().mockReturnThis(),
};

const mockSupabase = {
  from: vi.fn().mockReturnValue(mockQuery),
};

vi.mock('@/lib/supabase/server', () => ({
  createClient: () => mockSupabase,
}));

describe('ContactRepository', () => {
  let contactRepository: ContactRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    contactRepository = new ContactRepository();
  });

  describe('getAdminContactInfo', () => {
    it('should fetch admin contact info successfully', async () => {
      const mockData: AdminContactInfo[] = [
        {
          id: '1',
          admin_id: 'admin-1',
          contact_type: 'email',
          contact_value: 'admin@example.com',
          display_name: 'Admin Team',
          is_active: true,
          is_primary: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ];

      mockQuery.select.mockResolvedValue({ data: mockData, error: null });

      const result = await contactRepository.getAdminContactInfo('admin-1');

      expect(mockSupabase.from).toHaveBeenCalledWith('admin_contact_info');
      expect(mockQuery.select).toHaveBeenCalledWith('*');
      expect(mockQuery.eq).toHaveBeenCalledWith('admin_id', 'admin-1');
      expect(mockQuery.eq).toHaveBeenCalledWith('is_active', true);
      expect(mockQuery.order).toHaveBeenCalledWith('contact_type', { ascending: true });
      expect(result).toEqual(mockData);
    });

    it('should handle errors when fetching admin contact info', async () => {
      mockQuery.select.mockResolvedValue({ 
        data: null, 
        error: { message: 'Database error' } 
      });

      await expect(contactRepository.getAdminContactInfo('admin-1'))
        .rejects.toThrow('Failed to fetch admin contact info: Database error');
    });
  });

  describe('getActiveAdminContacts', () => {
    it('should fetch active admin contacts successfully', async () => {
      const mockData: AdminContactInfo[] = [
        {
          id: '1',
          admin_id: 'admin-1',
          contact_type: 'email',
          contact_value: 'admin@example.com',
          display_name: null,
          is_active: true,
          is_primary: false,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ];

      mockQuery.select.mockResolvedValue({ data: mockData, error: null });

      const result = await contactRepository.getActiveAdminContacts();

      expect(mockSupabase.from).toHaveBeenCalledWith('admin_contact_info');
      expect(mockQuery.eq).toHaveBeenCalledWith('is_active', true);
      expect(result).toEqual(mockData);
    });
  });

  describe('createAdminContactInfo', () => {
    it('should create admin contact info successfully', async () => {
      const newContact: Omit<AdminContactInfo, 'id' | 'created_at' | 'updated_at'> = {
        admin_id: 'admin-1',
        contact_type: 'telegram',
        contact_value: '@admin',
        display_name: 'Admin',
        is_active: true,
        is_primary: false,
      };

      const mockCreatedContact: AdminContactInfo = {
        ...newContact,
        id: '1',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      mockQuery.single.mockResolvedValue({ data: mockCreatedContact, error: null });

      const result = await contactRepository.createAdminContactInfo(newContact);

      expect(mockSupabase.from).toHaveBeenCalledWith('admin_contact_info');
      expect(mockQuery.insert).toHaveBeenCalledWith(newContact);
      expect(mockQuery.select).toHaveBeenCalled();
      expect(mockQuery.single).toHaveBeenCalled();
      expect(result).toEqual(mockCreatedContact);
    });

    it('should handle errors when creating admin contact info', async () => {
      const newContact: Omit<AdminContactInfo, 'id' | 'created_at' | 'updated_at'> = {
        admin_id: 'admin-1',
        contact_type: 'email',
        contact_value: 'admin@example.com',
        display_name: null,
        is_active: true,
        is_primary: false,
      };

      mockQuery.single.mockResolvedValue({ 
        data: null, 
        error: { message: 'Constraint violation' } 
      });

      await expect(contactRepository.createAdminContactInfo(newContact))
        .rejects.toThrow('Failed to create admin contact info: Constraint violation');
    });
  });

  describe('getPurchaseRequests', () => {
    it('should fetch all purchase requests when no userId provided', async () => {
      const mockData: PurchaseRequest[] = [
        {
          id: '1',
          user_id: 'user-1',
          item_type: 'book',
          item_id: 'book-1',
          amount: 29.99,
          status: 'pending',
          preferred_contact_method: 'email',
          user_message: 'Please process quickly',
          admin_notes: null,
          contacted_at: null,
          responded_at: null,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ];

      mockQuery.select.mockResolvedValue({ data: mockData, error: null });

      const result = await contactRepository.getPurchaseRequests();

      expect(mockSupabase.from).toHaveBeenCalledWith('purchase_requests');
      expect(mockQuery.select).toHaveBeenCalledWith(expect.stringContaining('book:books'));
      expect(mockQuery.order).toHaveBeenCalledWith('created_at', { ascending: false });
      expect(result).toEqual(mockData);
    });

    it('should fetch user-specific purchase requests when userId provided', async () => {
      const mockData: PurchaseRequest[] = [];

      mockQuery.select.mockResolvedValue({ data: mockData, error: null });

      const result = await contactRepository.getPurchaseRequests('user-1');

      expect(mockQuery.eq).toHaveBeenCalledWith('user_id', 'user-1');
      expect(result).toEqual(mockData);
    });
  });

  describe('createPurchaseRequest', () => {
    it('should create purchase request successfully', async () => {
      const newRequest: Omit<PurchaseRequest, 'id' | 'created_at' | 'updated_at' | 'status' | 'contacted_at' | 'responded_at' | 'admin_notes'> = {
        user_id: 'user-1',
        item_type: 'book',
        item_id: 'book-1',
        amount: 29.99,
        preferred_contact_method: 'email',
        user_message: 'Please process quickly',
      };

      const mockCreatedRequest: PurchaseRequest = {
        ...newRequest,
        id: '1',
        status: 'pending',
        admin_notes: null,
        contacted_at: null,
        responded_at: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      mockQuery.single.mockResolvedValue({ data: mockCreatedRequest, error: null });

      const result = await contactRepository.createPurchaseRequest(newRequest);

      expect(mockSupabase.from).toHaveBeenCalledWith('purchase_requests');
      expect(mockQuery.insert).toHaveBeenCalledWith({
        ...newRequest,
        status: 'pending',
      });
      expect(result).toEqual(mockCreatedRequest);
    });
  });

  describe('updatePurchaseRequestStatus', () => {
    it('should update status to contacted with timestamp', async () => {
      const mockUpdatedRequest: PurchaseRequest = {
        id: '1',
        user_id: 'user-1',
        item_type: 'book',
        item_id: 'book-1',
        amount: 29.99,
        status: 'contacted',
        preferred_contact_method: 'email',
        user_message: null,
        admin_notes: 'Contacted via email',
        contacted_at: '2024-01-01T12:00:00Z',
        responded_at: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T12:00:00Z',
      };

      mockQuery.single.mockResolvedValue({ data: mockUpdatedRequest, error: null });

      const result = await contactRepository.updatePurchaseRequestStatus(
        '1',
        'contacted',
        'Contacted via email'
      );

      expect(mockQuery.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'contacted',
          admin_notes: 'Contacted via email',
          contacted_at: expect.any(String),
        })
      );
      expect(result).toEqual(mockUpdatedRequest);
    });

    it('should update status to approved with responded timestamp', async () => {
      const mockUpdatedRequest: PurchaseRequest = {
        id: '1',
        user_id: 'user-1',
        item_type: 'book',
        item_id: 'book-1',
        amount: 29.99,
        status: 'approved',
        preferred_contact_method: 'email',
        user_message: null,
        admin_notes: 'Approved for purchase',
        contacted_at: '2024-01-01T12:00:00Z',
        responded_at: '2024-01-01T13:00:00Z',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T13:00:00Z',
      };

      mockQuery.single.mockResolvedValue({ data: mockUpdatedRequest, error: null });

      const result = await contactRepository.updatePurchaseRequestStatus(
        '1',
        'approved',
        'Approved for purchase'
      );

      expect(mockQuery.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'approved',
          admin_notes: 'Approved for purchase',
          responded_at: expect.any(String),
        })
      );
      expect(result).toEqual(mockUpdatedRequest);
    });
  });

  describe('getPurchaseRequestStats', () => {
    it('should return correct statistics', async () => {
      const mockData = [
        { status: 'pending' },
        { status: 'pending' },
        { status: 'contacted' },
        { status: 'approved' },
        { status: 'rejected' },
        { status: 'completed' },
      ];

      mockQuery.select.mockResolvedValue({ data: mockData, error: null });

      const result = await contactRepository.getPurchaseRequestStats();

      expect(result).toEqual({
        total: 6,
        pending: 2,
        contacted: 1,
        approved: 1,
        rejected: 1,
        completed: 1,
      });
    });

    it('should handle empty results', async () => {
      mockQuery.select.mockResolvedValue({ data: [], error: null });

      const result = await contactRepository.getPurchaseRequestStats();

      expect(result).toEqual({
        total: 0,
        pending: 0,
        contacted: 0,
        approved: 0,
        rejected: 0,
        completed: 0,
      });
    });
  });
});