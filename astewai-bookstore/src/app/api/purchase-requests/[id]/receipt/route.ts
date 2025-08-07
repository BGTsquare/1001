import { NextRequest, NextResponse } from 'next/server';
import { ContactService } from '@/lib/services/contact-service';
import { createClient } from '@/lib/supabase/server';
import { generateReceiptPDF } from '@/lib/utils/receipt-generator';

const contactService = new ContactService();

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the purchase request
    const purchaseRequest = await contactService.getPurchaseRequestById(params.id);
    
    if (!purchaseRequest) {
      return NextResponse.json({ error: 'Purchase request not found' }, { status: 404 });
    }

    // Check if user owns this request
    if (purchaseRequest.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if receipt can be generated (only for approved/completed requests)
    if (!['approved', 'completed'].includes(purchaseRequest.status)) {
      return NextResponse.json(
        { error: 'Receipt not available for this request status' },
        { status: 400 }
      );
    }

    // Get user profile for receipt
    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('id', user.id)
      .single();

    // Generate PDF receipt
    const pdfBuffer = await generateReceiptPDF({
      request: purchaseRequest,
      user: {
        id: user.id,
        email: user.email || '',
        display_name: profile?.display_name || 'Customer'
      }
    });

    // Return PDF as response
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="receipt-AST-${purchaseRequest.id.slice(-8).toUpperCase()}.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Error generating receipt:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate receipt' },
      { status: 500 }
    );
  }
}