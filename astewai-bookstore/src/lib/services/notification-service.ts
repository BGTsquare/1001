import { createClient } from '@/lib/supabase/server';
import type { PurchaseRequest, AdminContactInfo } from '@/types';

export interface NotificationService {
  notifyAdminsOfNewPurchaseRequest(request: PurchaseRequest): Promise<void>;
  sendEmailNotification(to: string, subject: string, content: string): Promise<void>;
}

export class EmailNotificationService implements NotificationService {
  private supabase = createClient();

  async notifyAdminsOfNewPurchaseRequest(request: PurchaseRequest): Promise<void> {
    try {
      // Get all admin users
      const { data: adminProfiles, error: profileError } = await this.supabase
        .from('profiles')
        .select('id, display_name')
        .eq('role', 'admin');

      if (profileError) {
        console.error('Failed to fetch admin profiles:', profileError);
        return;
      }

      if (!adminProfiles || adminProfiles.length === 0) {
        console.warn('No admin users found for notification');
        return;
      }

      // Get admin contact information
      const { data: adminContacts, error: contactError } = await this.supabase
        .from('admin_contact_info')
        .select('*')
        .eq('is_active', true)
        .eq('contact_type', 'email');

      if (contactError) {
        console.error('Failed to fetch admin contacts:', contactError);
        return;
      }

      if (!adminContacts || adminContacts.length === 0) {
        console.warn('No admin email contacts found for notification');
        return;
      }

      // Generate notification content
      const subject = `New Purchase Request - ${request.item_type === 'book' ? 'Book' : 'Bundle'}`;
      const itemName = request.book?.title || request.bundle?.title || 'Unknown Item';
      
      const content = this.generatePurchaseRequestNotificationContent(request, itemName);

      // Send notifications to all admin email contacts
      const notificationPromises = adminContacts.map(contact => 
        this.sendEmailNotification(contact.contact_value, subject, content)
      );

      await Promise.allSettled(notificationPromises);
      
      console.log(`Sent purchase request notifications to ${adminContacts.length} admin contacts`);
    } catch (error) {
      console.error('Failed to notify admins of new purchase request:', error);
    }
  }

  async sendEmailNotification(to: string, subject: string, content: string): Promise<void> {
    try {
      // In a real implementation, this would integrate with an email service like:
      // - Supabase Edge Functions with Resend
      // - SendGrid
      // - AWS SES
      // - Nodemailer with SMTP
      
      // For now, we'll log the notification (in production, replace with actual email sending)
      console.log('Email Notification:', {
        to,
        subject,
        content,
        timestamp: new Date().toISOString()
      });

      // Simulate email sending delay
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // In production, you would do something like:
      /*
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to, subject, content })
      });
      
      if (!response.ok) {
        throw new Error('Failed to send email');
      }
      */
    } catch (error) {
      console.error(`Failed to send email notification to ${to}:`, error);
      throw error;
    }
  }

  private generatePurchaseRequestNotificationContent(request: PurchaseRequest, itemName: string): string {
    const itemType = request.item_type === 'book' ? 'Book' : 'Bundle';
    
    return `
New Purchase Request Received

Item: ${itemName} (${itemType})
Amount: $${request.amount}
Request ID: ${request.id}
Created: ${new Date(request.created_at).toLocaleString()}

${request.preferred_contact_method ? `Preferred Contact: ${request.preferred_contact_method}` : ''}
${request.user_message ? `User Message: ${request.user_message}` : ''}

Please review and process this request in the admin dashboard.

---
This is an automated notification from the Astewai Digital Bookstore.
    `.trim();
  }
}

// Factory function to create notification service
export function createNotificationService(): NotificationService {
  return new EmailNotificationService();
}