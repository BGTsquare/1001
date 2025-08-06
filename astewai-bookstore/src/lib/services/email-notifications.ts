import { sendEmail, sendBatchEmails, EMAIL_CONFIG, type EmailResult } from './email';
import { WelcomeEmail } from '@/components/emails/welcome-email';
import { PurchaseReceiptEmail } from '@/components/emails/purchase-receipt-email';
import { PurchaseConfirmationEmail } from '@/components/emails/purchase-confirmation-email';
import { PasswordResetEmail } from '@/components/emails/password-reset-email';
import { SecurityNotificationEmail } from '@/components/emails/security-notification-email';
import { AdminPurchaseApprovalEmail } from '@/components/emails/admin-purchase-approval-email';
import { PurchaseRejectionEmail } from '@/components/emails/purchase-rejection-email';

// Email notification result type
export interface NotificationResult extends EmailResult {
  type?: string;
  recipient?: string;
}

// Utility function for consistent error handling
async function handleEmailSend(
  emailPromise: Promise<EmailResult>,
  type: string,
  recipient: string
): Promise<NotificationResult> {
  try {
    const result = await emailPromise;
    if (!result.success) {
      console.error(`Failed to send ${type} email to ${recipient}:`, result.error);
    }
    return { ...result, type, recipient };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Error sending ${type} email to ${recipient}:`, errorMessage);
    return { success: false, error: errorMessage, type, recipient };
  }
}

// Types for email data
export interface PurchaseItem {
  id: string;
  title: string;
  type: 'book' | 'bundle';
  price: number;
  quantity: number;
}

export interface UserData {
  id: string;
  name: string;
  email: string;
}

export interface PurchaseData {
  id: string;
  items: PurchaseItem[];
  totalAmount: number;
  purchaseDate: string;
  paymentMethod?: string;
}

/**
 * Send welcome email to new users
 */
export async function sendWelcomeEmail(user: UserData): Promise<NotificationResult> {
  return handleEmailSend(
    sendEmail({
      to: user.email,
      subject: `Welcome to Astewai Bookstore, ${user.name}! 📚`,
      template: WelcomeEmail({
        userName: user.name,
        userEmail: user.email,
      }),
      tags: ['welcome', 'onboarding'],
    }),
    'welcome',
    user.email
  );
}

/**
 * Send purchase receipt email (immediate after purchase)
 */
export async function sendPurchaseReceiptEmail(
  user: UserData,
  purchase: PurchaseData
): Promise<NotificationResult> {
  return handleEmailSend(
    sendEmail({
      to: user.email,
      subject: `Purchase Receipt - Order #${purchase.id}`,
      template: PurchaseReceiptEmail({
        userName: user.name,
        purchaseId: purchase.id,
        items: purchase.items,
        totalAmount: purchase.totalAmount,
        purchaseDate: purchase.purchaseDate,
        paymentMethod: purchase.paymentMethod,
      }),
      tags: ['purchase', 'receipt', `order:${purchase.id}`],
    }),
    'purchase_receipt',
    user.email
  );
}

/**
 * Send purchase confirmation email (after admin approval)
 */
export async function sendPurchaseConfirmationEmail(
  user: UserData,
  purchase: PurchaseData,
  approvedDate: string
): Promise<NotificationResult> {
  return handleEmailSend(
    sendEmail({
      to: user.email,
      subject: `Purchase Confirmed - Order #${purchase.id} 🎉`,
      template: PurchaseConfirmationEmail({
        userName: user.name,
        purchaseId: purchase.id,
        items: purchase.items,
        totalAmount: purchase.totalAmount,
        approvedDate,
      }),
      tags: ['purchase', 'confirmation', 'approved', `order:${purchase.id}`],
    }),
    'purchase_confirmation',
    user.email
  );
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  user: UserData,
  resetUrl: string,
  expiresIn: string = '1 hour'
) {
  return sendEmail({
    to: user.email,
    subject: 'Reset Your Astewai Bookstore Password',
    template: PasswordResetEmail({
      userName: user.name,
      resetUrl,
      expiresIn,
    }),
  });
}

/**
 * Send security notification email
 */
export async function sendSecurityNotificationEmail(
  user: UserData,
  eventType: 'login' | 'password_change' | 'email_change' | 'suspicious_activity',
  eventDetails: {
    timestamp: string;
    ipAddress?: string;
    location?: string;
    device?: string;
  }
) {
  const subjects = {
    login: 'New Login to Your Account',
    password_change: 'Password Changed Successfully',
    email_change: 'Email Address Updated',
    suspicious_activity: '🚨 Suspicious Activity Detected',
  };

  return sendEmail({
    to: user.email,
    subject: `Security Alert: ${subjects[eventType]}`,
    template: SecurityNotificationEmail({
      userName: user.name,
      eventType,
      eventDetails,
    }),
  });
}

/**
 * Send admin notification for purchase approval
 */
export async function sendAdminPurchaseApprovalEmail(
  user: UserData,
  purchase: PurchaseData,
  adminEmails: string[] = [EMAIL_CONFIG.ADMIN_ADDRESS]
) {
  return sendBatchEmails(
    adminEmails.map((adminEmail) => ({
      to: adminEmail,
      subject: `🔔 Purchase Approval Required - Order #${purchase.id}`,
      template: AdminPurchaseApprovalEmail({
        purchaseId: purchase.id,
        customerName: user.name,
        customerEmail: user.email,
        items: purchase.items,
        totalAmount: purchase.totalAmount,
        purchaseDate: purchase.purchaseDate,
        paymentMethod: purchase.paymentMethod,
      }),
    }))
  );
}

/**
 * Send purchase rejection email
 */
export async function sendPurchaseRejectionEmail(
  user: UserData,
  purchase: PurchaseData,
  rejectionReason?: string
): Promise<NotificationResult> {
  return handleEmailSend(
    sendEmail({
      to: user.email,
      subject: `Purchase Declined - Order #${purchase.id}`,
      template: PurchaseRejectionEmail({
        userName: user.name,
        purchaseId: purchase.id,
        items: purchase.items,
        totalAmount: purchase.totalAmount,
        purchaseDate: purchase.purchaseDate,
        rejectionReason: rejectionReason || 'No reason provided',
      }),
      tags: ['purchase', 'rejection', 'declined', `order:${purchase.id}`],
    }),
    'purchase_rejection',
    user.email
  );
}

// Improved type definitions for batch notifications
export type NotificationRequest = 
  | { type: 'welcome'; user: UserData; data?: never }
  | { type: 'purchase_receipt'; user: UserData; data: PurchaseData }
  | { type: 'purchase_confirmation'; user: UserData; data: { purchase: PurchaseData; approvedDate: string } }
  | { type: 'purchase_rejection'; user: UserData; data: { purchase: PurchaseData; rejectionReason?: string } }
  | { type: 'password_reset'; user: UserData; data: { resetUrl: string; expiresIn?: string } }
  | { type: 'security'; user: UserData; data: { eventType: 'login' | 'password_change' | 'email_change' | 'suspicious_activity'; eventDetails: { timestamp: string; ipAddress?: string; location?: string; device?: string } } }
  | { type: 'admin_approval'; user: UserData; data: { purchase: PurchaseData; adminEmails?: string[] } };

/**
 * Batch send multiple notification types with improved type safety
 */
export async function sendBatchNotifications(notifications: NotificationRequest[]) {
  const emailPromises = notifications.map(async (notification) => {
    try {
      switch (notification.type) {
        case 'welcome':
          return await sendWelcomeEmail(notification.user);
        case 'purchase_receipt':
          return await sendPurchaseReceiptEmail(notification.user, notification.data);
        case 'purchase_confirmation':
          return await sendPurchaseConfirmationEmail(
            notification.user, 
            notification.data.purchase, 
            notification.data.approvedDate
          );
        case 'purchase_rejection':
          return await sendPurchaseRejectionEmail(
            notification.user, 
            notification.data.purchase, 
            notification.data.rejectionReason
          );
        case 'password_reset':
          return await sendPasswordResetEmail(
            notification.user, 
            notification.data.resetUrl, 
            notification.data.expiresIn
          );
        case 'security':
          return await sendSecurityNotificationEmail(
            notification.user, 
            notification.data.eventType, 
            notification.data.eventDetails
          );
        case 'admin_approval':
          return await sendAdminPurchaseApprovalEmail(
            notification.user, 
            notification.data.purchase, 
            notification.data.adminEmails
          );
        default:
          // TypeScript will ensure this is never reached
          const exhaustiveCheck: never = notification;
          throw new Error(`Unknown notification type: ${JSON.stringify(exhaustiveCheck)}`);
      }
    } catch (error) {
      console.error(`Failed to send ${notification.type} notification:`, error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  return Promise.allSettled(emailPromises);
}