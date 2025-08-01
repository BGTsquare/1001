import { ClientContactRepository } from '@/lib/repositories/client-contact-repository';
import { validateContactValue, formatContactValue, generateContactUrl } from '@/lib/validation/contact-validation';
import type { AdminContactInfo, PurchaseRequest, ContactMethod, AdminContactForm, PurchaseRequestForm } from '@/types';

export class ClientContactService {
  private contactRepository = new ClientContactRepository();

  // Admin contact info methods (read-only for regular users)
  async getActiveAdminContacts(): Promise<AdminContactInfo[]> {
    return this.contactRepository.getActiveAdminContacts();
  }

  async getPrimaryAdminContacts(): Promise<AdminContactInfo[]> {
    return this.contactRepository.getPrimaryAdminContacts();
  }

  // Admin-only methods for managing their own contact info
  async getMyContactInfo(): Promise<AdminContactInfo[]> {
    return this.contactRepository.getMyContactInfo();
  }

  async createMyContactInfo(contactForm: AdminContactForm): Promise<AdminContactInfo> {
    // Validate contact value format
    const validation = validateContactValue(contactForm.contactType, contactForm.contactValue);
    if (!validation.success) {
      throw new Error(`Invalid ${contactForm.contactType} format`);
    }

    // Format the contact value
    const formattedValue = formatContactValue(contactForm.contactType, contactForm.contactValue);

    // Check if contact already exists
    const existingContacts = await this.contactRepository.getMyContactInfo();
    const duplicate = existingContacts.find(
      contact => contact.contact_type === contactForm.contactType && 
                 contact.contact_value === formattedValue
    );

    if (duplicate) {
      throw new Error(`${contactForm.contactType} contact already exists`);
    }

    const contactInfo: Omit<AdminContactInfo, 'id' | 'admin_id' | 'created_at' | 'updated_at'> = {
      contact_type: contactForm.contactType,
      contact_value: formattedValue,
      display_name: contactForm.displayName || null,
      is_active: contactForm.isActive,
      is_primary: contactForm.isPrimary,
    };

    return this.contactRepository.createMyContactInfo(contactInfo);
  }

  async updateMyContactInfo(id: string, updates: Partial<AdminContactForm>): Promise<AdminContactInfo> {
    const updateData: Partial<AdminContactInfo> = {};

    if (updates.contactValue && updates.contactType) {
      // Validate and format new contact value
      const validation = validateContactValue(updates.contactType, updates.contactValue);
      if (!validation.success) {
        throw new Error(`Invalid ${updates.contactType} format`);
      }
      updateData.contact_value = formatContactValue(updates.contactType, updates.contactValue);
    }

    if (updates.displayName !== undefined) {
      updateData.display_name = updates.displayName || null;
    }

    if (updates.isActive !== undefined) {
      updateData.is_active = updates.isActive;
    }

    if (updates.isPrimary !== undefined) {
      updateData.is_primary = updates.isPrimary;
    }

    return this.contactRepository.updateMyContactInfo(id, updateData);
  }

  async deleteMyContactInfo(id: string): Promise<void> {
    return this.contactRepository.deleteMyContactInfo(id);
  }

  // Purchase request methods
  async getMyPurchaseRequests(): Promise<PurchaseRequest[]> {
    return this.contactRepository.getMyPurchaseRequests();
  }

  async getAllPurchaseRequests(): Promise<PurchaseRequest[]> {
    // This method is for admins only
    return this.contactRepository.getAllPurchaseRequests();
  }

  async createPurchaseRequest(requestForm: PurchaseRequestForm): Promise<PurchaseRequest> {
    const request: Omit<PurchaseRequest, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'status' | 'contacted_at' | 'responded_at' | 'admin_notes'> = {
      item_type: requestForm.itemType,
      item_id: requestForm.itemId,
      amount: requestForm.amount,
      preferred_contact_method: requestForm.preferredContactMethod || null,
      user_message: requestForm.userMessage || null,
    };

    return this.contactRepository.createPurchaseRequest(request);
  }

  async updatePurchaseRequestStatus(
    id: string, 
    status: PurchaseRequest['status'], 
    adminNotes?: string
  ): Promise<PurchaseRequest> {
    return this.contactRepository.updatePurchaseRequestStatus(id, status, adminNotes);
  }

  // Helper methods for generating contact URLs and messages
  generateContactUrl(contact: AdminContactInfo, message?: string): string {
    return generateContactUrl(contact.contact_type, contact.contact_value, message);
  }

  generatePurchaseRequestMessage(request: PurchaseRequest): string {
    const itemName = request.book?.title || request.bundle?.title || 'Unknown Item';
    const itemType = request.item_type === 'book' ? 'Book' : 'Bundle';
    
    let message = `Hi! I'd like to purchase the ${itemType.toLowerCase()}: "${itemName}" for $${request.amount}.`;
    
    if (request.user_message) {
      message += `\n\nAdditional message: ${request.user_message}`;
    }
    
    message += `\n\nRequest ID: ${request.id}`;
    
    return message;
  }

  // Get contact methods grouped by type
  async getContactMethodsByType(): Promise<Record<ContactMethod, AdminContactInfo[]>> {
    const contacts = await this.getActiveAdminContacts();
    
    const grouped: Record<ContactMethod, AdminContactInfo[]> = {
      telegram: [],
      whatsapp: [],
      email: [],
    };

    contacts.forEach(contact => {
      grouped[contact.contact_type].push(contact);
    });

    return grouped;
  }

  // Get the best contact method for a user preference
  async getBestContactMethod(preferredMethod?: ContactMethod): Promise<AdminContactInfo | null> {
    const primaryContacts = await this.getPrimaryAdminContacts();
    
    if (preferredMethod) {
      const preferred = primaryContacts.find(contact => contact.contact_type === preferredMethod);
      if (preferred) return preferred;
    }

    // Fallback to any primary contact
    return primaryContacts[0] || null;
  }

  // Real-time subscriptions
  subscribeToMyPurchaseRequests(callback: (payload: any) => void) {
    return this.contactRepository.subscribeToMyPurchaseRequests(callback);
  }

  subscribeToAllPurchaseRequests(callback: (payload: any) => void) {
    return this.contactRepository.subscribeToAllPurchaseRequests(callback);
  }
}