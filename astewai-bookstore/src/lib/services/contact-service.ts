import { ContactRepository } from '@/lib/repositories/contact-repository';
import { validateContactValue, formatContactValue } from '@/lib/validation/contact-validation';
import type { AdminContactInfo, PurchaseRequest, ContactMethod, AdminContactForm, PurchaseRequestForm } from '@/types';

export class ContactService {
  private contactRepository = new ContactRepository();

  // Admin contact info methods
  async getAdminContactInfo(adminId: string): Promise<AdminContactInfo[]> {
    return this.contactRepository.getAdminContactInfo(adminId);
  }

  async getActiveAdminContacts(): Promise<AdminContactInfo[]> {
    return this.contactRepository.getActiveAdminContacts();
  }

  async getPrimaryAdminContacts(): Promise<AdminContactInfo[]> {
    return this.contactRepository.getPrimaryAdminContacts();
  }

  async createAdminContactInfo(adminId: string, contactForm: AdminContactForm): Promise<AdminContactInfo> {
    // Validate contact value format
    const validation = validateContactValue(contactForm.contactType, contactForm.contactValue);
    if (!validation.success) {
      throw new Error(`Invalid ${contactForm.contactType} format`);
    }

    // Format the contact value
    const formattedValue = formatContactValue(contactForm.contactType, contactForm.contactValue);

    // Check if contact already exists
    const existingContacts = await this.contactRepository.getAdminContactInfo(adminId);
    const duplicate = existingContacts.find(
      contact => contact.contact_type === contactForm.contactType && 
                 contact.contact_value === formattedValue
    );

    if (duplicate) {
      throw new Error(`${contactForm.contactType} contact already exists`);
    }

    const contactInfo: Omit<AdminContactInfo, 'id' | 'created_at' | 'updated_at'> = {
      admin_id: adminId,
      contact_type: contactForm.contactType,
      contact_value: formattedValue,
      display_name: contactForm.displayName || null,
      is_active: contactForm.isActive,
      is_primary: contactForm.isPrimary,
    };

    return this.contactRepository.createAdminContactInfo(contactInfo);
  }

  async updateAdminContactInfo(id: string, updates: Partial<AdminContactForm>): Promise<AdminContactInfo> {
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

    return this.contactRepository.updateAdminContactInfo(id, updateData);
  }

  async deleteAdminContactInfo(id: string): Promise<void> {
    return this.contactRepository.deleteAdminContactInfo(id);
  }

  // Purchase request methods
  async getPurchaseRequests(userId?: string): Promise<PurchaseRequest[]> {
    return this.contactRepository.getPurchaseRequests(userId);
  }

  async getPurchaseRequestById(id: string): Promise<PurchaseRequest | null> {
    return this.contactRepository.getPurchaseRequestById(id);
  }

  async createPurchaseRequest(userId: string, requestForm: PurchaseRequestForm): Promise<PurchaseRequest> {
    // Validate that the item exists (this would typically involve checking books/bundles tables)
    // For now, we'll assume the validation is done at the API level

    const request: Omit<PurchaseRequest, 'id' | 'created_at' | 'updated_at' | 'status' | 'contacted_at' | 'responded_at' | 'admin_notes'> = {
      user_id: userId,
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

  async approvePurchaseRequest(id: string, adminNotes?: string): Promise<PurchaseRequest> {
    return this.updatePurchaseRequestStatus(id, 'approved', adminNotes);
  }

  async rejectPurchaseRequest(id: string, adminNotes?: string): Promise<PurchaseRequest> {
    return this.updatePurchaseRequestStatus(id, 'rejected', adminNotes);
  }

  async markPurchaseRequestContacted(id: string, adminNotes?: string): Promise<PurchaseRequest> {
    return this.updatePurchaseRequestStatus(id, 'contacted', adminNotes);
  }

  async completePurchaseRequest(id: string, adminNotes?: string): Promise<PurchaseRequest> {
    return this.updatePurchaseRequestStatus(id, 'completed', adminNotes);
  }

  async deletePurchaseRequest(id: string): Promise<void> {
    return this.contactRepository.deletePurchaseRequest(id);
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
    return this.contactRepository.getPurchaseRequestStats();
  }

  // Helper methods for generating contact messages
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
}