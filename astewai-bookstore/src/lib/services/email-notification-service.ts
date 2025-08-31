import { createClient } from '@/lib/supabase/server';
import type { PurchaseRequest, AdminContactInfo } from '@/types';

export interface EmailNotificationService {
  sendPurchaseRequestNotification(request: PurchaseRequest): Promise<void>;
  sendStatusUpdateNotification(request: PurchaseRequest, previousStatus: string): Promise<void>;
  sendAdminNotification(request: PurchaseRequest): Promise<void>;
  sendPaymentConfirmationUploadedNotification(request: PurchaseRequest, confirmationCount: number): Promise<void>;
  sendPaymentConfirmationReceivedNotification(request: PurchaseRequest): Promise<void>;
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

  async sendPaymentConfirmationUploadedNotification(request: PurchaseRequest, confirmationCount: number): Promise<void> {
    try {
      // Get admin email from environment or database
      const adminEmail = process.env.ADMIN_EMAIL || 'admin@astewai.com';

      const itemName = request.book?.title || request.bundle?.title || 'Unknown Item';
      const transactionReference = `AST-${request.id.slice(-8).toUpperCase()}`;
      const subject = `New Payment Confirmation Uploaded - ${transactionReference}`;

      const htmlContent = this.generatePaymentConfirmationUploadedEmail(request, itemName, confirmationCount, transactionReference);

      await this.sendEmail(adminEmail, subject, htmlContent);

      console.log(`Sent payment confirmation upload notification to admin`);
    } catch (error) {
      console.error('Failed to send payment confirmation upload notification:', error);
    }
  }

  async sendPaymentConfirmationReceivedNotification(request: PurchaseRequest): Promise<void> {
    try {
      // Get user email
      const { data: user, error: userError } = await this.supabase.auth.admin.getUserById(request.user_id);

      if (userError || !user?.user?.email) {
        console.error('Failed to get user email for confirmation received notification:', userError);
        return;
      }

      const itemName = request.book?.title || request.bundle?.title || 'Unknown Item';
      const transactionReference = `AST-${request.id.slice(-8).toUpperCase()}`;
      const subject = `Payment Confirmation Received - ${transactionReference}`;

      const htmlContent = this.generatePaymentConfirmationReceivedEmail(request, itemName, transactionReference);

      await this.sendEmail(user.user.email, subject, htmlContent);

      console.log(`Sent payment confirmation received notification to ${user.user.email}`);
    } catch (error) {
      console.error('Failed to send payment confirmation received notification:', error);
    }
  }

  private generatePaymentConfirmationUploadedEmail(request: PurchaseRequest, itemName: string, confirmationCount: number, transactionReference: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>New Payment Confirmation Uploaded</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="margin: 0; font-size: 28px;">New Payment Confirmation</h1>
        <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">A customer has uploaded payment proof</p>
    </div>

    <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
        <div style="background: white; padding: 25px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h2 style="color: #2c3e50; margin-top: 0;">Purchase Details</h2>

            <div style="background: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <p style="margin: 5px 0;"><strong>Item:</strong> ${itemName}</p>
                <p style="margin: 5px 0;"><strong>Amount:</strong> $${request.amount.toFixed(2)}</p>
                <p style="margin: 5px 0;"><strong>Transaction Reference:</strong> ${transactionReference}</p>
                <p style="margin: 5px 0;"><strong>Files Uploaded:</strong> ${confirmationCount}</p>
                <p style="margin: 5px 0;"><strong>Request ID:</strong> ${request.id}</p>
            </div>

            <p>A customer has uploaded payment confirmation files for their purchase. Please review and approve the payment in the admin dashboard.</p>

            <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.NEXT_PUBLIC_SITE_URL}/admin/payments"
                   style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; display: inline-block; font-weight: bold; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);">
                    Review Payment Confirmations
                </a>
            </div>
        </div>

        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6;">
            <p style="color: #6c757d; font-size: 14px; margin: 0;">
                This is an automated notification from Astewai Digital Bookstore
            </p>
        </div>
    </div>
</body>
</html>
    `.trim();
  }

  private generatePaymentConfirmationReceivedEmail(request: PurchaseRequest, itemName: string, transactionReference: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Payment Confirmation Received</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="margin: 0; font-size: 28px;">Payment Confirmation Received</h1>
        <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">We've received your payment proof</p>
    </div>

    <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
        <div style="background: white; padding: 25px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <p>Thank you for uploading your payment confirmation for <strong>${itemName}</strong>.</p>

            <div style="background: #e8f5e8; border-left: 4px solid #28a745; padding: 15px; margin: 20px 0;">
                <p style="margin: 0; color: #155724;">
                    <strong>What's next?</strong> Our team will review your payment confirmation and approve your purchase within 24 hours.
                </p>
            </div>

            <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <p style="margin: 5px 0;"><strong>Transaction Reference:</strong> ${transactionReference}</p>
                <p style="margin: 5px 0;"><strong>Item:</strong> ${itemName}</p>
                <p style="margin: 5px 0;"><strong>Amount:</strong> $${request.amount.toFixed(2)}</p>
            </div>

            <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.NEXT_PUBLIC_SITE_URL}/purchase-requests"
                   style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; display: inline-block; font-weight: bold; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);">
                    Track Your Purchase
                </a>
            </div>
        </div>

        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6;">
            <p style="color: #6c757d; font-size: 14px; margin: 0;">
                This is an automated notification from Astewai Digital Bookstore
            </p>
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