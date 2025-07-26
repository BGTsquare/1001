import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { bookService } from '@/lib/services/book-service'
import { bundleService } from '@/lib/services/bundle-service'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { itemType, itemId, amount } = body

    if (!itemType || !itemId || amount === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: itemType, itemId, amount' },
        { status: 400 }
      )
    }

    if (itemType !== 'book' && itemType !== 'bundle') {
      return NextResponse.json(
        { error: 'Invalid item type. Must be "book" or "bundle"' },
        { status: 400 }
      )
    }

    // Verify the item exists and get its details
    let item: any = null
    if (itemType === 'book') {
      const bookResult = await bookService.getBookById(itemId)
      if (!bookResult.success || !bookResult.data) {
        return NextResponse.json(
          { error: 'Book not found' },
          { status: 404 }
        )
      }
      item = bookResult.data

      // Check if it's a free book
      if (item.is_free) {
        return NextResponse.json(
          { error: 'This book is free. Use the "Add to Library" option instead.' },
          { status: 400 }
        )
      }

      // Verify the amount matches the book price
      if (amount !== item.price) {
        return NextResponse.json(
          { error: 'Amount does not match book price' },
          { status: 400 }
        )
      }
    } else if (itemType === 'bundle') {
      const bundleResult = await bundleService.getBundleById(itemId)
      if (!bundleResult.success || !bundleResult.data) {
        return NextResponse.json(
          { error: 'Bundle not found' },
          { status: 404 }
        )
      }
      item = bundleResult.data

      // Verify the amount matches the bundle price
      if (amount !== item.price) {
        return NextResponse.json(
          { error: 'Amount does not match bundle price' },
          { status: 400 }
        )
      }
    }

    // Check if user already has a pending purchase for this item
    const { data: existingPurchase } = await supabase
      .from('purchases')
      .select('id, status')
      .eq('user_id', user.id)
      .eq('item_type', itemType)
      .eq('item_id', itemId)
      .in('status', ['pending', 'approved', 'completed'])
      .single()

    if (existingPurchase) {
      const statusMessage = {
        pending: 'You already have a pending purchase for this item',
        approved: 'You already have an approved purchase for this item',
        completed: 'You have already purchased this item'
      }[existingPurchase.status] || 'Purchase already exists'

      return NextResponse.json(
        { error: statusMessage },
        { status: 409 }
      )
    }

    // Create purchase record
    const { data: purchase, error: insertError } = await supabase
      .from('purchases')
      .insert({
        user_id: user.id,
        item_type: itemType,
        item_id: itemId,
        amount,
        status: 'pending', // Will be updated when payment is processed
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error creating purchase:', insertError)
      return NextResponse.json(
        { error: 'Failed to create purchase' },
        { status: 500 }
      )
    }

    // In a real implementation, you would:
    // 1. Create a Stripe payment intent
    // 2. Return the client secret for frontend payment processing
    // 3. Handle webhook events to update purchase status
    
    // For now, we'll simulate a manual approval process
    return NextResponse.json({
      message: 'Purchase request created successfully. It will be reviewed for approval.',
      purchase,
      // In real implementation, you would return:
      // checkoutUrl: stripeCheckoutUrl,
      // clientSecret: paymentIntent.client_secret,
    })

  } catch (error) {
    console.error('Error in create purchase API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}