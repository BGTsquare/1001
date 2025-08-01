import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ContactService } from '../contact-service';
import { ContactRepository } from '@/lib/repositories/contact-repository';
import type { AdminContactInfo, PurchaseRequest, AdminContactForm, PurchaseRequestForm } from '@/types';

// Mock the ContactRepository
vi.mock('@/lib/repositories/contact-repository');

// Mock the notification service
vi.mock('../notification-service', () => ({
  createNotificationService: () => ({
    notifyAdminsOfNewPurchaseRequest: vi.fn().mockResolvedValue(undefined)
  })
}));

const mockContactRepository = {
  getAdminContactInfo: vi.fn(),
  getActiveAdminContacts: vi.fn(),
  getPrimaryAdminContacts: vi.fn(),
  createAdminContactInfo: vi.fn(),
  updateAdminContactInfo: vi.fn(),
  deleteAdminContactInfo: vi.fn(),
  getPurchaseRequests: vi.fn(),
  getPurchaseRequestById: vi.fn(),
  createPurchaseRequest: vi.fn(),
  updatePurchaseRequestStatus: vi.fn(),
  deletePurchaseRequest: vi.fn(),
  getPurchaseRequestStats: vi.fn(),
};

// Mock validation functions
vi.mock('@/lib/validation/contact-validation', () => ({
  validateContactValue: vi.fn(() => ({ success: true })),
  formatContactValue: vi.fn((type, value) => value),
}));

describe('ContactService', () => {
  let contactService: ContactService;
  
  const mockAdminContact: AdminContactInfo = {
    id: '1',
    admin_id: 'admin-1',
    contact_type: 'email',
    contact_value: 'admin@example.com',
    display_name: 'Admin Team',
    is_active: true,
    is_primary: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (ContactRepository as any).mockImplementation(() => mockContactRepository);
    contactService = new ContactService();
  });

  describe('Admin Contact Info Methods', () => {

    it('should get admin contact info', async () => {
      mockContactRepository.getAdminContactInfo.mockResolvedValue([mockAdminContact]);

      const result = await contactService.getAdminContactInfo('admin-1');

      expect(mockContactRepository.getAdminContactInfo).toHaveBeenCalledWith('admin-1');
      expect(result).toEqual([mockAdminContact]);
    });

    it('should get active admin contacts', async () => {
      mockContactRepository.getActiveAdminContacts.mockResolvedValue([mockAdminContact]);

      const result = await contactService.getActiveAdminContacts();

      expect(mockContactRepository.getActiveAdminContacts).toHaveBeenCalled();
      expect(result).toEqual([mockAdminContact]);
    });

    it('should get primary admin contacts', async () => {
      mockContactRepository.getPrimaryAdminContacts.mockResolvedValue([mockAdminContact]);

      const result = await contactService.getPrimaryAdminContacts();

      expect(mockContactRepository.getPrimaryAdminContacts).toHaveBeenCalled();
      expect(result).toEqual([mockAdminContact]);
    });

    it('should create admin contact info', async () => {
      const contactForm: AdminContactForm = {
        contactType: 'telegram',
        contactValue: '@admin_user',
        displayName: 'Admin Team',
        isActive: true,
        isPrimary: true,
      };

      const newContact = { ...mockAdminContact, contact_type: 'telegram' as const, contact_value: '@admin_user' };
      mockContactRepository.getAdminContactInfo.mockResolvedValue([]); // No existing contacts
      mockContactRepository.createAdminContactInfo.mockResolvedValue(newContact);

      const result = await contactService.createAdminContactInfo('admin-1', contactForm);

      expect(mockContactRepository.createAdminContactInfo).toHaveBeenCalledWith({
        admin_id: 'admin-1',
        contact_type: 'telegram',
        contact_value: '@admin_user',
        display_name: 'Admin Team',
        is_active: true,
        is_primary: true,
      });
      expect(result).toEqual(newContact);
    });

    it('should update admin contact info', async () => {
      const updates = { displayName: 'Updated Admin' };
      mockContactRepository.updateAdminContactInfo.mockResolvedValue({
        ...mockAdminContact,
        display_name: 'Updated Admin',
      });

      const result = await contactService.updateAdminContactInfo('1', updates);

      expect(mockContactRepository.updateAdminContactInfo).toHaveBeenCalledWith('1', {
        display_name: 'Updated Admin',
      });
      expect(result.display_name).toBe('Updated Admin');
    });

    it('should delete admin contact info', async () => {
      mockContactRepository.deleteAdminContactInfo.mockResolvedValue(undefined);

      await contactService.deleteAdminContactInfo('1');

      expect(mockContactRepository.deleteAdminContactInfo).toHaveBeenCalledWith('1');
    });
  });

  describe('Purchase Request Methods', () => {
    const mockPurchaseRequest: PurchaseRequest = {
      id: '1',
      user_id: 'user-1',
      item_type: 'book',
      item_id: 'book-1',
      amount: 29.99,
      status: 'pending',
      preferred_contact_method: 'email',
      user_message: 'Please process my purchase',
      admin_notes: null,
      contacted_at: null,
      responded_at: null,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    };

    it('should get purchase requests', async () => {
      mockContactRepository.getPurchaseRequests.mockResolvedValue([mockPurchaseRequest]);

      const result = await contactService.getPurchaseRequests();

      expect(mockContactRepository.getPurchaseRequests).toHaveBeenCalledWith(undefined);
      expect(result).toEqual([mockPurchaseRequest]);
    });

    it('should get purchase requests for specific user', async () => {
      mockContactRepository.getPurchaseRequests.mockResolvedValue([mockPurchaseRequest]);

      const result = await contactService.getPurchaseRequests('user-1');

      expect(mockContactRepository.getPurchaseRequests).toHaveBeenCalledWith('user-1');
      expect(result).toEqual([mockPurchaseRequest]);
    });

    it('should get purchase request by id', async () => {
      mockContactRepository.getPurchaseRequestById.mockResolvedValue(mockPurchaseRequest);

      const result = await contactService.getPurchaseRequestById('1');

      expect(mockContactRepository.getPurchaseRequestById).toHaveBeenCalledWith('1');
      expect(result).toEqual(mockPurchaseRequest);
    });

    it('should create purchase request', async () => {
      const requestForm: PurchaseRequestForm = {
        itemType: 'book',
        itemId: 'book-1',
        amount: 29.99,
        preferredContactMethod: 'email',
        userMessage: 'Please process my purchase',
      };

      mockContactRepository.createPurchaseRequest.mockResolvedValue(mockPurchaseRequest);

      const result = await contactService.createPurchaseRequest('user-1', requestForm);

      expect(mockContactRepository.createPurchaseRequest).toHaveBeenCalledWith({
        user_id: 'user-1',
        item_type: 'book',
        item_id: 'book-1',
        amount: 29.99,
        preferred_contact_method: 'email',
        user_message: 'Please process my purchase',
      });
      expect(result).toEqual(mockPurchaseRequest);
    });

    it('should update purchase request status', async () => {
      const updatedRequest = { ...mockPurchaseRequest, status: 'approved' as const };
      mockContactRepository.updatePurchaseRequestStatus.mockResolvedValue(updatedRequest);

      const result = await contactService.updatePurchaseRequestStatus('1', 'approved', 'Approved by admin');

      expect(mockContactRepository.updatePurchaseRequestStatus).toHaveBeenCalledWith('1', 'approved', 'Approved by admin');
      expect(result).toEqual(updatedRequest);
    });

    it('should approve purchase request', async () => {
      const approvedRequest = { ...mockPurchaseRequest, status: 'approved' as const };
      mockContactRepository.updatePurchaseRequestStatus.mockResolvedValue(approvedRequest);

      const result = await contactService.approvePurchaseRequest('1', 'Approved');

      expect(mockContactRepository.updatePurchaseRequestStatus).toHaveBeenCalledWith('1', 'approved', 'Approved');
      expect(result).toEqual(approvedRequest);
    });

    it('should reject purchase request', async () => {
      const rejectedRequest = { ...mockPurchaseRequest, status: 'rejected' as const };
      mockContactRepository.updatePurchaseRequestStatus.mockResolvedValue(rejectedRequest);

      const result = await contactService.rejectPurchaseRequest('1', 'Rejected');

      expect(mockContactRepository.updatePurchaseRequestStatus).toHaveBeenCalledWith('1', 'rejected', 'Rejected');
      expect(result).toEqual(rejectedRequest);
    });

    it('should mark purchase request as contacted', async () => {
      const contactedRequest = { ...mockPurchaseRequest, status: 'contacted' as const };
      mockContactRepository.updatePurchaseRequestStatus.mockResolvedValue(contactedRequest);

      const result = await contactService.markPurchaseRequestContacted('1', 'User contacted');

      expect(mockContactRepository.updatePurchaseRequestStatus).toHaveBeenCalledWith('1', 'contacted', 'User contacted');
      expect(result).toEqual(contactedRequest);
    });

    it('should complete purchase request', async () => {
      const completedRequest = { ...mockPurchaseRequest, status: 'completed' as const };
      mockContactRepository.updatePurchaseRequestStatus.mockResolvedValue(completedRequest);

      const result = await contactService.completePurchaseRequest('1', 'Purchase completed');

      expect(mockContactRepository.updatePurchaseRequestStatus).toHaveBeenCalledWith('1', 'completed', 'Purchase completed');
      expect(result).toEqual(completedRequest);
    });

    it('should delete purchase request', async () => {
      mockContactRepository.deletePurchaseRequest.mockResolvedValue(undefined);

      await contactService.deletePurchaseRequest('1');

      expect(mockContactRepository.deletePurchaseRequest).toHaveBeenCalledWith('1');
    });

    it('should get purchase request stats', async () => {
      const mockStats = {
        total: 10,
        pending: 3,
        contacted: 2,
        approved: 3,
        rejected: 1,
        completed: 1,
      };
      mockContactRepository.getPurchaseRequestStats.mockResolvedValue(mockStats);

      const result = await contactService.getPurchaseRequestStats();

      expect(mockContactRepository.getPurchaseRequestStats).toHaveBeenCalled();
      expect(result).toEqual(mockStats);
    });
  });

  describe('Helper Methods', () => {
    it('should generate purchase request message', () => {
      const request: PurchaseRequest = {
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
        book: {
          id: 'book-1',
          title: 'Test Book',
          author: 'Test Author',
          description: 'Test Description',
          cover_image_url: null,
          content_url: null,
          price: 29.99,
          is_free: false,
          category: null,
          tags: null,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      };

      const message = contactService.generatePurchaseRequestMessage(request);

      expect(message).toContain('Test Book');
      expect(message).toContain('29.99');
      expect(message).toContain('Please process quickly');
      expect(message).toContain('Request ID: 1');
    });

    it('should get contact methods by type', async () => {
      const mockContacts = [
        { ...mockAdminContact, contact_type: 'email' as const },
        { ...mockAdminContact, id: '2', contact_type: 'telegram' as const },
      ];
      mockContactRepository.getActiveAdminContacts.mockResolvedValue(mockContacts);

      const result = await contactService.getContactMethodsByType();

      expect(result.email).toHaveLength(1);
      expect(result.telegram).toHaveLength(1);
      expect(result.whatsapp).toHaveLength(0);
    });

    it('should get best contact method with preference', async () => {
      const mockContacts = [
        { ...mockAdminContact, contact_type: 'email' as const },
        { ...mockAdminContact, id: '2', contact_type: 'telegram' as const },
      ];
      mockContactRepository.getPrimaryAdminContacts.mockResolvedValue(mockContacts);

      const result = await contactService.getBestContactMethod('telegram');

      expect(result?.contact_type).toBe('telegram');
    });

    it('should get best contact method without preference', async () => {
      const mockContacts = [mockAdminContact];
      mockContactRepository.getPrimaryAdminContacts.mockResolvedValue(mockContacts);

      const result = await contactService.getBestContactMethod();

      expect(result).toEqual(mockAdminContact);
    });
  });
});