import { NextRequest, NextResponse } from 'next/server';
import { ContactService } from '@/lib/services/contact-service';
import { purchaseRequestSchema } from '@/lib/validation/contact-validation';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const contactService = new ContactService();

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const isAdmin = url.searchParams.get('admin') === 'true';

    // Check if user is admin for admin requests
    if (isAdmin) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profile?.role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      const requests = await contactService.getPurchaseRequests();
      return NextResponse.json({ data: requests });
    } else {
      // Regular user - only their own requests
      const requests = await contactService.getPurchaseRequests(user.id);
      return NextResponse.json({ data: requests });
    }
  } catch (error) {
    console.error('Error fetching purchase requests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch purchase requests' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validationResult = purchaseRequestSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const request_data = await contactService.createPurchaseRequest(user.id, validationResult.data);
    return NextResponse.json({ data: request_data }, { status: 201 });
  } catch (error) {
    console.error('Error creating purchase request:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create purchase request' },
      { status: 500 }
    );
  }
}