import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const createPurchaseSchema = z.object({
  itemType: z.enum(['book', 'bundle']),
  itemId: z.string().uuid(),
  amount: z.number().positive(),
  userMessage: z.string().optional()
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Validate request body
    const body = await request.json();
    const validatedData = createPurchaseSchema.parse(body);

    // Check if item exists
    const itemTable = validatedData.itemType === 'book' ? 'books' : 'bundles';
    const { data: item, error: itemError } = await supabase
      .from(itemTable)
      .select('id, title, price')
      .eq('id', validatedData.itemId)
      .single();

    if (itemError || !item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    // Verify price matches
    if (item.price !== validatedData.amount) {
      return NextResponse.json({ error: 'Price mismatch' }, { status: 400 });
    }

    // Check for existing pending purchase request
    const { data: existingPurchase } = await supabase
      .from('purchase_requests')
      .select('id')
      .eq('user_id', user.id)
      .eq('item_id', validatedData.itemId)
      .eq('item_type', validatedData.itemType)
      .in('status', ['pending', 'contacted', 'approved'])
      .single();

    if (existingPurchase) {
      return NextResponse.json({
        error: 'You already have a pending purchase request for this item'
      }, { status: 400 });
    }

    // Create purchase request record
    const { data: purchaseRequest, error: purchaseError } = await supabase
      .from('purchase_requests')
      .insert({
        user_id: user.id,
        item_type: validatedData.itemType,
        item_id: validatedData.itemId,
        amount: validatedData.amount,
        status: 'pending',
        user_message: validatedData.userMessage || null
      })
      .select()
      .single();

    if (purchaseError) {
      console.error('Error creating purchase request:', purchaseError);
      return NextResponse.json({ error: 'Failed to create purchase request' }, { status: 500 });
    }

    // Get active payment methods
    const { data: paymentMethods, error: paymentError } = await supabase
      .from('payment_config')
      .select('*')
      .eq('is_active', true)
      .order('display_order');

    if (paymentError) {
      console.error('Error fetching payment methods:', paymentError);
      return NextResponse.json({ error: 'Failed to fetch payment methods' }, { status: 500 });
    }

    // Format payment methods for response
    const formattedPaymentMethods = paymentMethods.map(method => ({
      id: method.id,
      type: method.config_type,
      provider: method.provider_name,
      accountNumber: method.account_number,
      accountName: method.account_name,
      instructions: method.instructions || ''
    }));

    // Send notification to admin (optional - implement based on your notification system)
    try {
      // You can implement email/notification logic here
      console.log(`New purchase request: ${purchaseRequest.id} by ${user.email}`);
    } catch (notificationError) {
      console.error('Failed to send admin notification:', notificationError);
      // Don't fail the request if notification fails
    }

    return NextResponse.json({
      data: {
        purchaseId: purchaseRequest.id,
        paymentMethods: formattedPaymentMethods
      },
      message: 'Purchase request created successfully'
    });

  } catch (error) {
    console.error('Error in POST /api/purchases/simple:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Invalid request data',
        details: error.errors 
      }, { status: 400 });
    }

    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 });
  }
}

// GET endpoint to fetch user's purchases
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Get user's purchase requests with item details
    const { data: purchaseRequests, error } = await supabase
      .from('purchase_requests')
      .select(`
        *,
        book:books(id, title, author, price, cover_image_url),
        bundle:bundles(id, title, price)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching purchase requests:', error);
      return NextResponse.json({ error: 'Failed to fetch purchase requests' }, { status: 500 });
    }

    return NextResponse.json({ purchaseRequests });

  } catch (error) {
    console.error('Error in GET /api/purchases/simple:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
