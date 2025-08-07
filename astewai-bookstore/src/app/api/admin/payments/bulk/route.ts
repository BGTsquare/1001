import { NextRequest, NextResponse } from 'next/server';
import { ContactService } from '@/lib/services/contact-service';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const contactService = new ContactService();

const bulkActionSchema = z.object({
  requestIds: z.array(z.string()).min(1, 'At least one request ID is required'),
  action: z.enum(['approve', 'reject']),
  notes: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const validationResult = bulkActionSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { requestIds, action, notes } = validationResult.data;
    const status = action === 'approve' ? 'approved' : 'rejected';

    // Process each request
    const results = [];
    const errors = [];

    for (const requestId of requestIds) {
      try {
        const updatedRequest = await contactService.updatePurchaseRequestStatus(
          requestId,
          status,
          notes
        );
        results.push(updatedRequest);
      } catch (error) {
        console.error(`Failed to update request ${requestId}:`, error);
        errors.push({
          requestId,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // Return results with any errors
    const response = {
      success: results.length,
      failed: errors.length,
      results,
      errors: errors.length > 0 ? errors : undefined
    };

    if (errors.length === requestIds.length) {
      return NextResponse.json(
        { error: 'All requests failed to update', details: response },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: response });
  } catch (error) {
    console.error('Error processing bulk action:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process bulk action' },
      { status: 500 }
    );
  }
}