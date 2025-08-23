import { NextRequest, NextResponse } from 'next/server';
import { ContactService } from '@/lib/services/contact-service';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const contactService = new ContactService();

const cancelRequestSchema = z.object({
  reason: z.string().min(1, 'Cancellation reason is required').max(500, 'Reason too long'),
});

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const { id } = params;
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate request body
    const body = await request.json();
    const validationResult = cancelRequestSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { reason } = validationResult.data;

    // Get the purchase request
    const purchaseRequest = await contactService.getPurchaseRequestById(id);
    
    if (!purchaseRequest) {
      return NextResponse.json({ error: 'Purchase request not found' }, { status: 404 });
    }

    // Check if user owns this request
    if (purchaseRequest.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if request can be cancelled
    if (!['pending', 'contacted'].includes(purchaseRequest.status)) {
      return NextResponse.json(
        { error: 'Request cannot be cancelled in its current status' },
        { status: 400 }
      );
    }

    // Cancel the request
    const cancelledRequest = await contactService.cancelPurchaseRequest(
      id,
      reason,
      user.id
    );

    // Send notification to admins about cancellation
    await contactService.notifyAdminOfCancellation(cancelledRequest, reason);

    return NextResponse.json({ 
      data: cancelledRequest,
      message: 'Request cancelled successfully'
    });
  } catch (error) {
    console.error('Error cancelling purchase request:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to cancel request' },
      { status: 500 }
    );
  }
}