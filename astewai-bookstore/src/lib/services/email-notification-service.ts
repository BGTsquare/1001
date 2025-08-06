import { createClient } from '@/lib/supabase/server';
import type { PurchaseRequest, AdminContactInfo } from '@/types';

export interface EmailNotificationService {
  sendPurchaseRequestNotification(request: PurchaseRequest): Promise<void>;
  sendStatusUpdateNotification(request: PurchaseRequest, previousStatus: string): Promise<void>;
  sendAdminNotification(request: PurchaseRequest): Promise<void>;
}

export class SupabaseEmailNotificationService implements EmailNotificationService {
  private supabase = createClient();

  async sendPurchaseRequestNotification(request: PurchaseRequest): Promise<void> {
    try {
      // Get user email
      const { data: user, error: userError } = await this.supabase.auth.admin.getUserById(request.user_id);
      
      if (userError || !user?.user?.email) {
        console.error('Failed to get user email for notification:', userError);
        return;
      }

      const itemName = request.book?.title || request.bundle?.title || 'Unknown Item';
      const subject = 'Purchase Request Received - Astewai Digital Bookstore';
      
      const htmlContent = this.generatePurchaseRequestConfirmationEmail(request, itemName);
      
      await this.sendEmail(user.user.email, subject, htmlContent);
      
      console.log(`Sent purchase request confirmation to ${user.user.email}`);
    } catch (error) {
      console.error('Failed to send purchase request notification:', error);
    }
  }

  async sendStatusUpdateNotification(request: PurchaseRequest, previousStatus: string): Promise<void> {
    try {
      // Get user email
      const { data: user, error: userError } = await this.supabase.auth.admin.getUserById(request.user_id);
      
      if (userError || !user?.user?.email) {
        console.error('Failed to get user email for status update:', userError);
        return;
      }

      const itemName = request.book?.title || request.bundle?.title || 'Unknown Item';
      const subject = `Purchase Request Update - ${itemName}`;
      
      const htmlContent = this.generateStatusUpdateEmail(request, itemName, previousStatus);
      
      await this.sendEmail(user.user.email, subject, htmlContent);
      
      console.log(`Sent status update notification to ${user.user.email}`);
    } catch (error) {
      console.error('Failed to send status update notification:', error);
    }
  }

  async sendAdminNotification(request: PurchaseRequest): Promise<void> {
    try {
      // Get admin email contacts
      const { data: adminContacts, error: contactError } = await this.supabase
        .from('admin_contact_info')
        .select('contact_value')
        .eq('contact_type', 'email')
        .eq('is_active', true);

      if (contactError || !adminContacts || adminContacts.length === 0) {
        console.warn('No admin email contacts found for notification');
        return;
      }

      const itemName = request.book?.title || request.bundle?.title || 'Unknown Item';
      const subject = `New Purchase Request - ${itemName}`;
      
      const htmlContent = this.generateAdminNotificationEmail(request, itemName);
      
      // Send to all admin email contacts
      const emailPromises = adminContacts.map(contact => 
        this.sendEmail(contact.contact_value, subject, htmlContent)
      );

      await Promise.allSettled(emailPromises);
      
      console.log(`Sent admin notifications to ${adminContacts.length} contacts`);
    } catch (error) {
      console.error('Failed to send admin notification:', error);
    }
  }

  private async sendEmail(to: string, subject: string, htmlContent: string): Promise<void> {
    try {
      // Use Supabase Edge Function for sending emails
      const { data, error } = await this.supabase.functions.invoke('send-email', {
        body: {
          to,
          subject,
          html: htmlContent,
        },
      });

      if (error) {
        throw error;
      }

      console.log('Email sent successfully:', data);
    } catch (error) {
      console.error(`Failed to send email to ${to}:`, error);
      
      // Fallback: Log email content for manual processing
      console.log('Email content for manual processing:', {
        to,
        subject,
        html: htmlContent,
        timestamp: new Date().toISOString(),
      });
    }
  }

  private generatePurchaseRequestConfirmationEmail(request: PurchaseRequest, itemName: string): string {
    const itemType = request.item_type === 'book' ? 'Book' : 'Bundle';
    
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Purchase Request Received</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #f8f9fa; padding: 20px; text-align: center; border-radius: 8px; }
        .content { padding: 20px 0; }
        .item-details { background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px 0; }
        .status-badge { display: inline-block; padding: 4px 12px; background-color: #ffc107; color: #000; border-radius: 4px; font-size: 12px; font-weight: bold; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Purchase Request Received</h1>
            <p>Thank you for your purchase request!</p>
        </div>
        
        <div class="content">
            <p>Hello,</p>
            
            <p>We have received your purchase request and it is now being reviewed by our team.</p>
            
            <div class="item-details">
                <h3>Request Details</h3>
                <p><strong>Item:</strong> ${itemName} (${itemType})</p>
                <p><strong>Amount:</strong> $${request.amount}</p>
                <p><strong>Request ID:</strong> ${request.id}</p>
                <p><strong>Status:</strong> <span class="status-badge">Pending Review</span></p>
                <p><strong>Created:</strong> ${new Date(request.created_at).toLocaleString()}</p>
                ${request.preferred_contact_method ? `<p><strong>Preferred Contact:</strong> ${request.preferred_contact_method}</p>` : ''}
            </div>
            
            ${request.user_message ? `
            <div class="item-details">
                <h3>Your Message</h3>
                <p>${request.user_message}</p>
            </div>
            ` : ''}
            
            <p>Our team will review your request and contact you soon via your preferred method. You can track the status of your request in your account dashboard.</p>
            
            <p>If you have any questions, please don't hesitate to contact our support team.</p>
            
            <p>Best regards,<br>The Astewai Team</p>
        </div>
        
        <div class="footer">
            <p>This is an automated email from Astewai Digital Bookstore.</p>
            <p>Please do not reply to this email.</p>
        </div>
    </div>
</body>
</html>
    `.trim();
  }

  private generateStatusUpdateEmail(request: PurchaseRequest, itemName: string, previousStatus: string): string {
    const statusMessages = {
      contacted: {
        title: 'Admin Has Contacted You',
        message: 'Our team has reached out to you regarding your purchase request. Please check your preferred contact method for further instructions.',
        color: '#007bff'
      },
      approved: {
        title: 'Purchase Request Approved!',
        message: 'Great news! Your purchase request has been approved. Please follow the payment instructions provided by our team.',
        color: '#28a745'
      },
      rejected: {
        title: 'Purchase Request Update',
        message: 'Unfortunately, your purchase request could not be approved at this time. Please contact our support team for more information.',
        color: '#dc3545'
      },
      completed: {
        title: 'Purchase Complete!',
        message: 'Your purchase has been completed successfully! The item is now available in your library.',
        color: '#28a745'
      }
    };

    const statusInfo = statusMessages[request.status as keyof typeof statusMessages] || {
      title: 'Purchase Request Update',
      message: 'Your purchase request status has been updated.',
      color: '#6c757d'
    };

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>${statusInfo.title}</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: ${statusInfo.color}; color: white; padding: 20px; text-align: center; border-radius: 8px; }
        .content { padding: 20px 0; }
        .item-details { background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px 0; }
        .status-badge { display: inline-block; padding: 4px 12px; background-color: ${statusInfo.color}; color: white; border-radius: 4px; font-size: 12px; font-weight: bold; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${statusInfo.title}</h1>
        </div>
        
        <div class="content">
            <p>Hello,</p>
            
            <p>${statusInfo.message}</p>
            
            <div class="item-details">
                <h3>Request Details</h3>
                <p><strong>Item:</strong> ${itemName}</p>
                <p><strong>Amount:</strong> $${request.amount}</p>
                <p><strong>Request ID:</strong> ${request.id}</p>
                <p><strong>Status:</strong> <span class="status-badge">${request.status.charAt(0).toUpperCase() + request.status.slice(1)}</span></p>
                <p><strong>Updated:</strong> ${new Date(request.updated_at).toLocaleString()}</p>
            </div>
            
            ${request.admin_notes ? `
            <div class="item-details">
                <h3>Admin Notes</h3>
                <p>${request.admin_notes}</p>
            </div>
            ` : ''}
            
            <p>You can view the full details of your request in your account dashboard.</p>
            
            <p>Best regards,<br>The Astewai Team</p>
        </div>
        
        <div class="footer">
            <p>This is an automated email from Astewai Digital Bookstore.</p>
            <p>Please do not reply to this email.</p>
        </div>
    </div>
</body>
</html>
    `.trim();
  }

  private generateAdminNotificationEmail(request: PurchaseRequest, itemName: string): string {
    const itemType = request.item_type === 'book' ? 'Book' : 'Bundle';
    
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>New Purchase Request</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #007bff; color: white; padding: 20px; text-align: center; border-radius: 8px; }
        .content { padding: 20px 0; }
        .item-details { background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px 0; }
        .action-button { display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 4px; margin: 10px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>New Purchase Request</h1>
            <p>Action Required</p>
        </div>
        
        <div class="content">
            <p>A new purchase request has been submitted and requires your attention.</p>
            
            <div class="item-details">
                <h3>Request Details</h3>
                <p><strong>Item:</strong> ${itemName} (${itemType})</p>
                <p><strong>Amount:</strong> $${request.amount}</p>
                <p><strong>Request ID:</strong> ${request.id}</p>
                <p><strong>Created:</strong> ${new Date(request.created_at).toLocaleString()}</p>
                ${request.preferred_contact_method ? `<p><strong>Preferred Contact:</strong> ${request.preferred_contact_method}</p>` : ''}
            </div>
            
            ${request.user_message ? `
            <div class="item-details">
                <h3>User Message</h3>
                <p>${request.user_message}</p>
            </div>
            ` : ''}
            
            <p>Please review this request in the admin dashboard and take appropriate action.</p>
            
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/purchase-requests" class="action-button">
                View in Admin Dashboard
            </a>
        </div>
        
        <div class="footer">
            <p>This is an automated notification from Astewai Digital Bookstore Admin System.</p>
        </div>
    </div>
</body>
</html>
    `.trim();
  }
}

// Factory function
export function createEmailNotificationService(): EmailNotificationService {
  return new SupabaseEmailNotificationService();
}