'use server';

import { createClient } from '@/lib/supabase/server';
import {
  sendWelcomeEmail,
  sendPurchaseReceiptEmail,
  sendPurchaseConfirmationEmail,
  sendPasswordResetEmail,
  sendSecurityNotificationEmail,
  sendAdminPurchaseApprovalEmail,
  UserData,
  PurchaseData,
} from '@/lib/services/email-notifications';

/**
 * Send welcome email when user registers
 */
export async function sendWelcomeEmailAction(userId: string) {
  try {
    const supabase = await createClient();
    
    // Get user profile
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .eq('id', userId)
      .single();

    if (error || !profile) {
      throw new Error('User profile not found');
    }

    const userData: UserData = {
      id: profile.id,
      name: profile.full_name || 'User',
      email: profile.email,
    };

    const result = await sendWelcomeEmail(userData);
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to send welcome email');
    }

    return { success: true, id: result.id };
  } catch (error) {
    console.error('Send welcome email action error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send purchase receipt email
 */
export async function sendPurchaseReceiptAction(
  userId: string,
  purchaseId: string
) {
  try {
    const supabase = await createClient();
    
    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .eq('id', userId)
      .single();

    if (!profile) {
      throw new Error('User profile not found');
    }

    // Get purchase details
    const { data: purchase } = await supabase
      .from('purchases')
      .select(`
        id,
        total_amount,
        created_at,
        payment_method,
        purchase_items (
          id,
          quantity,
          price,
          books (id, title),
          bundles (id, title)
        )
      `)
      .eq('id', purchaseId)
      .single();

    if (!purchase) {
      throw new Error('Purchase not found');
    }

    const userData: UserData = {
      id: profile.id,
      name: profile.full_name || 'User',
      email: profile.email,
    };

    const purchaseData: PurchaseData = {
      id: purchase.id,
      totalAmount: purchase.total_amount,
      purchaseDate: new Date(purchase.created_at).toLocaleDateString(),
      paymentMethod: purchase.payment_method,
      items: purchase.purchase_items.map((item: any) => ({
        id: item.id,
        title: item.books?.title || item.bundles?.title || 'Unknown Item',
        type: item.books ? 'book' : 'bundle',
        price: item.price,
        quantity: item.quantity,
      })),
    };

    const result = await sendPurchaseReceiptEmail(userData, purchaseData);
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to send purchase receipt');
    }

    return { success: true, id: result.id };
  } catch (error) {
    console.error('Send purchase receipt action error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send purchase confirmation email after admin approval
 */
export async function sendPurchaseConfirmationAction(
  userId: string,
  purchaseId: string
) {
  try {
    const supabase = await createClient();
    
    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .eq('id', userId)
      .single();

    if (!profile) {
      throw new Error('User profile not found');
    }

    // Get purchase details
    const { data: purchase } = await supabase
      .from('purchases')
      .select(`
        id,
        total_amount,
        created_at,
        approved_at,
        purchase_items (
          id,
          quantity,
          price,
          books (id, title),
          bundles (id, title)
        )
      `)
      .eq('id', purchaseId)
      .single();

    if (!purchase) {
      throw new Error('Purchase not found');
    }

    const userData: UserData = {
      id: profile.id,
      name: profile.full_name || 'User',
      email: profile.email,
    };

    const purchaseData: PurchaseData = {
      id: purchase.id,
      totalAmount: purchase.total_amount,
      purchaseDate: new Date(purchase.created_at).toLocaleDateString(),
      items: purchase.purchase_items.map((item: any) => ({
        id: item.id,
        title: item.books?.title || item.bundles?.title || 'Unknown Item',
        type: item.books ? 'book' : 'bundle',
        price: item.price,
        quantity: item.quantity,
      })),
    };

    const approvedDate = purchase.approved_at 
      ? new Date(purchase.approved_at).toLocaleDateString()
      : new Date().toLocaleDateString();

    const result = await sendPurchaseConfirmationEmail(
      userData,
      purchaseData,
      approvedDate
    );
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to send purchase confirmation');
    }

    return { success: true, id: result.id };
  } catch (error) {
    console.error('Send purchase confirmation action error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send security notification email
 */
export async function sendSecurityNotificationAction(
  userId: string,
  eventType: 'login' | 'password_change' | 'email_change' | 'suspicious_activity',
  eventDetails: {
    timestamp: string;
    ipAddress?: string;
    location?: string;
    device?: string;
  }
) {
  try {
    const supabase = await createClient();
    
    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .eq('id', userId)
      .single();

    if (!profile) {
      throw new Error('User profile not found');
    }

    const userData: UserData = {
      id: profile.id,
      name: profile.full_name || 'User',
      email: profile.email,
    };

    const result = await sendSecurityNotificationEmail(
      userData,
      eventType,
      eventDetails
    );
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to send security notification');
    }

    return { success: true, id: result.id };
  } catch (error) {
    console.error('Send security notification action error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send admin purchase approval notification
 */
export async function sendAdminPurchaseApprovalAction(purchaseId: string) {
  try {
    const supabase = await createClient();
    
    // Get purchase with user details
    const { data: purchase } = await supabase
      .from('purchases')
      .select(`
        id,
        total_amount,
        created_at,
        payment_method,
        profiles (id, full_name, email),
        purchase_items (
          id,
          quantity,
          price,
          books (id, title),
          bundles (id, title)
        )
      `)
      .eq('id', purchaseId)
      .single();

    if (!purchase) {
      throw new Error('Purchase not found');
    }

    const userData: UserData = {
      id: purchase.profiles.id,
      name: purchase.profiles.full_name || 'User',
      email: purchase.profiles.email,
    };

    const purchaseData: PurchaseData = {
      id: purchase.id,
      totalAmount: purchase.total_amount,
      purchaseDate: new Date(purchase.created_at).toLocaleDateString(),
      paymentMethod: purchase.payment_method,
      items: purchase.purchase_items.map((item: any) => ({
        id: item.id,
        title: item.books?.title || item.bundles?.title || 'Unknown Item',
        type: item.books ? 'book' : 'bundle',
        price: item.price,
        quantity: item.quantity,
      })),
    };

    // Get admin emails
    const { data: admins } = await supabase
      .from('profiles')
      .select('email')
      .eq('role', 'admin');

    const adminEmails = admins?.map(admin => admin.email) || [];

    const results = await sendAdminPurchaseApprovalEmail(
      userData,
      purchaseData,
      adminEmails
    );
    
    const successCount = results.filter(result => result.success).length;
    
    return { 
      success: successCount > 0, 
      sent: successCount,
      total: results.length 
    };
  } catch (error) {
    console.error('Send admin purchase approval action error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}