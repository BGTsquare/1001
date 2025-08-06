import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  sendWelcomeEmail,
  sendPurchaseReceiptEmail,
  sendPurchaseConfirmationEmail,
  sendPasswordResetEmail,
  sendSecurityNotificationEmail,
  sendAdminPurchaseApprovalEmail,
} from '@/lib/services/email-notifications';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check if user is authenticated (for most email types)
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    const body = await request.json();
    const { type, data } = body;

    // Validate required fields
    if (!type || !data) {
      return NextResponse.json(
        { error: 'Missing required fields: type and data' },
        { status: 400 }
      );
    }

    let result;

    switch (type) {
      case 'welcome':
        if (!data.user) {
          return NextResponse.json(
            { error: 'User data required for welcome email' },
            { status: 400 }
          );
        }
        result = await sendWelcomeEmail(data.user);
        break;

      case 'purchase_receipt':
        if (!authError && user) {
          if (!data.purchase) {
            return NextResponse.json(
              { error: 'Purchase data required for receipt email' },
              { status: 400 }
            );
          }
          result = await sendPurchaseReceiptEmail(data.user, data.purchase);
        } else {
          return NextResponse.json(
            { error: 'Authentication required' },
            { status: 401 }
          );
        }
        break;

      case 'purchase_confirmation':
        if (!authError && user) {
          if (!data.purchase || !data.approvedDate) {
            return NextResponse.json(
              { error: 'Purchase data and approved date required' },
              { status: 400 }
            );
          }
          result = await sendPurchaseConfirmationEmail(
            data.user,
            data.purchase,
            data.approvedDate
          );
        } else {
          return NextResponse.json(
            { error: 'Authentication required' },
            { status: 401 }
          );
        }
        break;

      case 'password_reset':
        if (!data.user || !data.resetUrl) {
          return NextResponse.json(
            { error: 'User data and reset URL required' },
            { status: 400 }
          );
        }
        result = await sendPasswordResetEmail(
          data.user,
          data.resetUrl,
          data.expiresIn
        );
        break;

      case 'security_notification':
        if (!authError && user) {
          if (!data.eventType || !data.eventDetails) {
            return NextResponse.json(
              { error: 'Event type and details required' },
              { status: 400 }
            );
          }
          result = await sendSecurityNotificationEmail(
            data.user,
            data.eventType,
            data.eventDetails
          );
        } else {
          return NextResponse.json(
            { error: 'Authentication required' },
            { status: 401 }
          );
        }
        break;

      case 'admin_purchase_approval':
        // Check if user is admin
        if (!authError && user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

          if (profile?.role !== 'admin') {
            return NextResponse.json(
              { error: 'Admin access required' },
              { status: 403 }
            );
          }

          if (!data.user || !data.purchase) {
            return NextResponse.json(
              { error: 'User and purchase data required' },
              { status: 400 }
            );
          }

          result = await sendAdminPurchaseApprovalEmail(
            data.user,
            data.purchase,
            data.adminEmails
          );
        } else {
          return NextResponse.json(
            { error: 'Authentication required' },
            { status: 401 }
          );
        }
        break;

      default:
        return NextResponse.json(
          { error: `Unknown email type: ${type}` },
          { status: 400 }
        );
    }

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Email sent successfully',
        id: result.id,
      });
    } else {
      return NextResponse.json(
        { error: result.error || 'Failed to send email' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Email API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}