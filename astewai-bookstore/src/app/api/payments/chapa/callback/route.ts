import { NextRequest, NextResponse } from 'next/server'
import { purchaseService } from '@/lib/services/purchase-service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { tx_ref, status } = body

    if (!tx_ref) {
      return NextResponse.json(
        { error: 'Transaction reference is required' },
        { status: 400 }
      )
    }

    if (status === 'success') {
      // Complete the purchase
      const result = await purchaseService.completePurchase(tx_ref)
      
      if (!result.success) {
        console.error('Failed to complete purchase:', result.error)
        return NextResponse.json(
          { error: result.error || 'Failed to complete purchase' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        message: 'Purchase completed successfully',
        purchase: result.data
      })
    } else {
      // Payment failed or cancelled
      console.log('Payment failed or cancelled:', { tx_ref, status })
      return NextResponse.json({
        message: 'Payment was not successful',
        status
      })
    }

  } catch (error) {
    console.error('Error in Chapa callback:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Handle GET requests for verification
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tx_ref = searchParams.get('tx_ref')
    const status = searchParams.get('status')

    if (!tx_ref) {
      return NextResponse.json(
        { error: 'Transaction reference is required' },
        { status: 400 }
      )
    }

    if (status === 'success') {
      // Complete the purchase
      const result = await purchaseService.completePurchase(tx_ref)
      
      if (!result.success) {
        console.error('Failed to complete purchase:', result.error)
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/library?purchase=failed`)
      }

      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/library?purchase=success`)
    } else {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/library?purchase=cancelled`)
    }

  } catch (error) {
    console.error('Error in Chapa callback GET:', error)
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/library?purchase=error`)
  }
}