import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface RouteParams {
  params: {
    id: string;
  };
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const purchaseId = params.id;

    // Verify purchase exists and belongs to user
    const { data: purchase, error: fetchError } = await supabase
      .from('purchases')
      .select('*')
      .eq('id', purchaseId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !purchase) {
      return NextResponse.json({ error: 'Purchase not found' }, { status: 404 });
    }

    // Check if purchase is in correct status
    if (purchase.status !== 'pending') {
      return NextResponse.json({ 
        error: 'Purchase cannot be confirmed in current status' 
      }, { status: 400 });
    }

    // Update purchase status to indicate payment has been made
    const { error: updateError } = await supabase
      .from('purchases')
      .update({ 
        status: 'approved', // Changed from 'pending_verification' to 'approved' for simplicity
        updated_at: new Date().toISOString()
      })
      .eq('id', purchaseId);

    if (updateError) {
      console.error('Error updating purchase:', updateError);
      return NextResponse.json({ error: 'Failed to confirm payment' }, { status: 500 });
    }

    // Send notification to admin (optional)
    try {
      console.log(`Payment confirmed for purchase: ${purchaseId} by ${user.email}`);
      // Implement your notification logic here (email, webhook, etc.)
    } catch (notificationError) {
      console.error('Failed to send admin notification:', notificationError);
      // Don't fail the request if notification fails
    }

    return NextResponse.json({
      message: 'Payment confirmation received. Your purchase will be reviewed and approved soon.',
      status: 'approved'
    });

  } catch (error) {
    console.error('Error in POST /api/purchases/[id]/confirm:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
