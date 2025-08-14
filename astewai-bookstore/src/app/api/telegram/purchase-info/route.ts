import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 })
    }

    const supabase = await createClient()

    // Find purchase by initiation token
    const { data: purchase, error: purchaseError } = await supabase
      .from('purchases')
      .select('*')
      .eq('initiation_token', token)
      .eq('status', 'pending_initiation')
      .single()

    if (purchaseError || !purchase) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 404 })
    }

    // Get payment options from payment_config table
    const { data: paymentOptions, error: paymentError } = await supabase
      .from('payment_config')
      .select('*')
      .eq('is_active', true)
      .order('created_at')

    if (paymentError) {
      console.error('Error fetching payment options:', paymentError)
      return NextResponse.json({ error: 'Failed to fetch payment options' }, { status: 500 })
    }

    // Get item title based on type
    let itemTitle = 'Unknown Item'
    if (purchase.item_type === 'book') {
      const { data: book } = await supabase
        .from('books')
        .select('title')
        .eq('id', purchase.item_id)
        .single()
      itemTitle = book?.title || 'Unknown Book'
    } else if (purchase.item_type === 'bundle') {
      const { data: bundle } = await supabase
        .from('bundles')
        .select('title')
        .eq('id', purchase.item_id)
        .single()
      itemTitle = bundle?.title || 'Unknown Bundle'
    }

    // Format the response
    const response = {
      purchase: {
        id: purchase.id,
        itemId: purchase.item_id,
        itemType: purchase.item_type,
        itemTitle,
        amount: purchase.amount,
        amountInBirr: purchase.amount, // Use amount as birr amount
        transactionReference: purchase.transaction_reference
      },
      paymentOptions: paymentOptions?.map(option => ({
        providerName: option.provider_name,
        accountNumber: option.account_number,
        accountName: option.account_name,
        instructions: option.instructions
      })) || []
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Error in purchase-info API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}