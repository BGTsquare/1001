import { ContactRepository } from '@/lib/repositories/contact-repository';
import type { AdminContactInfo, PurchaseRequest, ContactMethod } from '@/types';
import type { RepositoryResult } from '@/lib/repositories/base-repository';

/**
 * Service layer for contact and purchase request business logic
 * Handles validation, business rules, and orchestration between repositories
 */
export class ContactService {
  private contactRepository: ContactRepository;

  constructor(isClient = false) {
    this.contactRepository = new ContactRepository(isClient);
  }

  /**
   * Get all active admin contacts
   */
  async getActiveAdminContacts(): Promise<RepositoryResult<AdminContactInfo[]>> {
    return this.contactRepository.getActiveAdminContacts();
  }

  /**
   * Get primary admin contacts (for urgent/important communications)
   */
  async getPrimaryAdminContacts(): Promise<RepositoryResult<AdminContactInfo[]>> {
    const result = await this.contactRepository.getActiveAdminContacts();
    
    if (!result.success || !result.data) {
      return result;
    }

    // Filter for primary contacts (you can adjust this logic based on your needs)
    const primaryContacts = result.data.filter(contact => 
      contact.is_primary || ['email', 'phone'].includes(contact.contact_type)
    );

    return { success: true, data: primaryContacts };
  }

  /**
   * Get all available admin contact methods for users
   * Filters out inactive contacts and sorts by priority
   */
  async getAvailableContactMethods(): Promise<RepositoryResult<AdminContactInfo[]>> {
    const result = await this.contactRepository.getActiveAdminContacts();
    
    if (!result.success || !result.data) {
      return result;
    }

    // Sort by display order and contact type for consistent presentation
    const sortedContacts = result.data.sort((a, b) => {
      if (a.display_order !== b.display_order) {
        return a.display_order - b.display_order;
      }
      return a.contact_type.localeCompare(b.contact_type);
    });

    return { success: true, data: sortedContacts };
  }

  /**
   * Create a new purchase request with business validation
   */
  async createPurchaseRequest(
    userId: string,
    itemType: 'book' | 'bundle',
    itemId: string,
    amount: number,
    preferredContactMethod?: ContactMethod,
    userMessage?: string
  ): Promise<RepositoryResult<PurchaseRequest>> {
    // Business validation
    if (amount <= 0) {
      return {
        success: false,
        error: 'Purchase amount must be greater than zero',
        code: 'INVALID_AMOUNT',
        status: 400
      };
    }

    // Check if user already has a pending request for this item
    const existingRequests = await this.contactRepository.getPurchaseRequests(userId);
    if (existingRequests.success && existingRequests.data) {
      const hasPendingRequest = existingRequests.data.some(
        request => 
          request.item_id === itemId && 
          request.item_type === itemType && 
          ['pending', 'contacted'].includes(request.status)
      );

      if (hasPendingRequest) {
        return {
          success: false,
          error: 'You already have a pending purchase request for this item',
          code: 'DUPLICATE_REQUEST',
          status: 409
        };
      }
    }

    // Create the purchase request
    return this.contactRepository.createPurchaseRequest({
      user_id: userId,
      item_type: itemType,
      item_id: itemId,
      amount,
      preferred_contact_method: preferredContactMethod,
      user_message: userMessage
    });
  }

  /**
   * Update purchase request status with business logic
   */
  async updatePurchaseRequestStatus(
    requestId: string,
    status: PurchaseRequest['status'],
    adminNotes?: string
  ): Promise<RepositoryResult<PurchaseRequest>> {
    // Validate status transitions
    const validTransitions: Record<string, string[]> = {
      'pending': ['contacted', 'rejected'],
      'contacted': ['approved', 'rejected'],
      'approved': ['completed'],
      'rejected': [], // Terminal state
      'completed': [] // Terminal state
    };

    // Get current request to validate transition
    const currentResult = await this.contactRepository.getPurchaseRequestById(requestId);
    if (!currentResult.success || !currentResult.data) {
      return {
        success: false,
        error: 'Purchase request not found',
        code: 'NOT_FOUND',
        status: 404
      };
    }

    const currentStatus = currentResult.data.status;
    if (!validTransitions[currentStatus]?.includes(status)) {
      return {
        success: false,
        error: `Invalid status transition from ${currentStatus} to ${status}`,
        code: 'INVALID_TRANSITION',
        status: 400
      };
    }

    return this.contactRepository.updatePurchaseRequestStatus(requestId, status, adminNotes);
  }

  /**
   * Get purchase request statistics for admin dashboard
   */
  async getPurchaseRequestStatistics(): Promise<RepositoryResult<{
    total: number;
    pending: number;
    contacted: number;
    approved: number;
    rejected: number;
    completed: number;
  }>> {
    return this.contactRepository.getPurchaseRequestStats();
  }

  /**
   * Get user's purchase request history
   */
  async getUserPurchaseHistory(userId: string): Promise<RepositoryResult<PurchaseRequest[]>> {
    return this.contactRepository.getPurchaseRequests(userId);
  }

  /**
   * Get purchase requests (all for admin, user-specific for regular users)
   */
  async getPurchaseRequests(userId?: string): Promise<PurchaseRequest[]> {
    const result = await this.contactRepository.getPurchaseRequests(userId);
    if (!result.success || !result.data) {
      return [];
    }
    return result.data;
  }

  /**
   * Get a specific purchase request by ID
   */
  async getPurchaseRequestById(requestId: string): Promise<PurchaseRequest | null> {
    const result = await this.contactRepository.getPurchaseRequestById(requestId);
    if (!result.success || !result.data) {
      return null;
    }
    return result.data;
  }

  /**
   * Approve a purchase request
   */
  async approvePurchaseRequest(requestId: string, adminNotes?: string): Promise<RepositoryResult<PurchaseRequest>> {
    return this.updatePurchaseRequestStatus(requestId, 'approved', adminNotes);
  }

  /**
   * Reject a purchase request
   */
  async rejectPurchaseRequest(requestId: string, adminNotes?: string): Promise<RepositoryResult<PurchaseRequest>> {
    return this.updatePurchaseRequestStatus(requestId, 'rejected', adminNotes);
  }

  /**
   * Get admin contact info for a specific admin
   */
  async getAdminContactInfo(adminId: string): Promise<RepositoryResult<AdminContactInfo[]>> {
    return this.contactRepository.getAdminContactInfo(adminId);
  }

  /**
   * Create admin contact info
   */
  async createAdminContactInfo(contactInfo: Omit<AdminContactInfo, 'id' | 'created_at' | 'updated_at'>): Promise<RepositoryResult<AdminContactInfo>> {
    return this.contactRepository.createAdminContactInfo(contactInfo);
  }

  /**
   * Update admin contact info
   */
  async updateAdminContactInfo(contactId: string, updates: Partial<AdminContactInfo>): Promise<RepositoryResult<AdminContactInfo>> {
    return this.contactRepository.updateAdminContactInfo(contactId, updates);
  }

  /**
   * Delete admin contact info
   */
  async deleteAdminContactInfo(contactId: string): Promise<RepositoryResult<void>> {
    return this.contactRepository.deleteAdminContactInfo(contactId);
  }

  /**
   * Generate a formatted message for purchase requests
   */
  generatePurchaseRequestMessage(request: PurchaseRequest): string {
    const itemName = (request as any).book?.title || (request as any).bundle?.title || 'Unknown Item';
    return `New purchase request for ${itemName} ($${request.amount.toFixed(2)})${request.user_message ? `\n\nUser message: ${request.user_message}` : ''}\n\nRequest ID: ${request.id}`;
  }

  /**
   * Get contact methods grouped by type
   */
  async getContactMethodsByType(): Promise<Record<ContactMethod, AdminContactInfo[]>> {
    const result = await this.getActiveAdminContacts();
    const contacts = result.success && result.data ? result.data : [];

    return {
      email: contacts.filter(c => c.contact_type === 'email'),
      telegram: contacts.filter(c => c.contact_type === 'telegram'),
      whatsapp: contacts.filter(c => c.contact_type === 'whatsapp'),
      phone: contacts.filter(c => c.contact_type === 'phone')
    };
  }

  /**
   * Get the best contact method for a user preference
   */
  async getBestContactMethod(preferredMethod?: ContactMethod): Promise<AdminContactInfo | null> {
    const result = await this.getPrimaryAdminContacts();
    const primaryContacts = result.success && result.data ? result.data : [];

    if (preferredMethod) {
      const preferred = primaryContacts.find(contact => contact.contact_type === preferredMethod);
      if (preferred) return preferred;
    }

    // Fallback to any primary contact
    return primaryContacts[0] || null;
  }
}

// Export singleton instances
export const contactService = new ContactService();
export const clientContactService = new ContactService(true);