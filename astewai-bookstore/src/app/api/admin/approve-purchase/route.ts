import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check if user is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Check admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { purchaseId } = await request.json()

    if (!purchaseId) {
      return NextResponse.json({ error: 'Purchase ID is required' }, { status: 400 })
    }

    // Use the database function to approve the purchase
    const { data: result, error } = await supabase
      .rpc('approve_purchase', { purchase_id_param: purchaseId })

    if (error) {
      console.error('Error approving purchase:', error)
      return NextResponse.json(
        { error: 'Failed to approve purchase' },
        { status: 500 }
      )
    }

    if (!result) {
      return NextResponse.json(
        { error: 'Purchase not found or already processed' },
        { status: 404 }
      )
    }

    // Get purchase details for Telegram notification
    const { data: purchase } = await supabase
      .from('purchases')
      .select('telegram_chat_id, transaction_reference, item_type')
      .eq('id', purchaseId)
      .single()

    // Send Telegram notification to user if they have a chat ID
    if (purchase?.telegram_chat_id) {
      try {
        await sendTelegramNotification(
          purchase.telegram_chat_id,
          `✅ **Purchase Approved!**\n\n` +
          `Your order **${purchase.transaction_reference}** has been approved!\n\n` +
          `Your ${purchase.item_type} has been added to your library. You can now access it from our website.\n\n` +
          `Thank you for your purchase! 📚`,
          process.env.TELEGRAM_BOT_TOKEN
        )
      } catch (telegramError) {
        console.error('Failed to send Telegram notification:', telegramError)
        // Don't fail the approval if Telegram notification fails
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Purchase approved successfully' 
    })

  } catch (error) {
    console.error('Error in approve purchase API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

