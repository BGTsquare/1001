import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

interface EmailNotificationData {
  type: string;
  data: any;
}

/**
 * Hook for sending email notifications via API
 */
export function useEmailNotifications() {
  const sendEmailMutation = useMutation({
    mutationFn: async (emailData: EmailNotificationData) => {
      const response = await fetch('/api/emails/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send email');
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast.success('Email sent successfully');
    },
    onError: (error) => {
      console.error('Email sending failed:', error);
      toast.error(error.message || 'Failed to send email');
    },
  });

  const sendWelcomeEmail = (userData: {
    id: string;
    name: string;
    email: string;
  }) => {
    return sendEmailMutation.mutate({
      type: 'welcome',
      data: { user: userData },
    });
  };

  const sendPurchaseReceipt = (
    userData: { id: string; name: string; email: string },
    purchaseData: any
  ) => {
    return sendEmailMutation.mutate({
      type: 'purchase_receipt',
      data: { user: userData, purchase: purchaseData },
    });
  };

  const sendPurchaseConfirmation = (
    userData: { id: string; name: string; email: string },
    purchaseData: any,
    approvedDate: string
  ) => {
    return sendEmailMutation.mutate({
      type: 'purchase_confirmation',
      data: { user: userData, purchase: purchaseData, approvedDate },
    });
  };

  const sendPasswordReset = (
    userData: { id: string; name: string; email: string },
    resetUrl: string,
    expiresIn?: string
  ) => {
    return sendEmailMutation.mutate({
      type: 'password_reset',
      data: { user: userData, resetUrl, expiresIn },
    });
  };

  const sendSecurityNotification = (
    userData: { id: string; name: string; email: string },
    eventType: string,
    eventDetails: any
  ) => {
    return sendEmailMutation.mutate({
      type: 'security_notification',
      data: { user: userData, eventType, eventDetails },
    });
  };

  const sendAdminPurchaseApproval = (
    userData: { id: string; name: string; email: string },
    purchaseData: any,
    adminEmails?: string[]
  ) => {
    return sendEmailMutation.mutate({
      type: 'admin_purchase_approval',
      data: { user: userData, purchase: purchaseData, adminEmails },
    });
  };

  return {
    sendWelcomeEmail,
    sendPurchaseReceipt,
    sendPurchaseConfirmation,
    sendPasswordReset,
    sendSecurityNotification,
    sendAdminPurchaseApproval,
    isLoading: sendEmailMutation.isPending,
    error: sendEmailMutation.error,
  };
}