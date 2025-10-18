import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { paymentService } from '@/lib/services/payment-service'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()

    // Auth
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Admin check
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const paymentRequestId = params.id
    const result = await paymentService.getPaymentRequest(paymentRequestId)
    if (!result.success || !result.data) {
      return NextResponse.json({ error: 'Payment request not found' }, { status: 404 })
    }

    const receipts: string[] = result.data.receipt_urls || []

    // Generate signed URLs for each object path
    const signedUrls: { objectPath: string; url?: string }[] = []

    for (const objPath of receipts) {
      try {
        const { data: signedData, error: signedError } = await supabase.storage
          .from('payment-receipts')
          .createSignedUrl(objPath, 60 * 60)

        if (signedError) {
          console.error('Error creating signed URL for', objPath, signedError)
          signedUrls.push({ objectPath: objPath })
        } else {
          signedUrls.push({ objectPath: objPath, url: signedData.signedUrl })
        }
      } catch (e) {
        console.error('Error generating signed url for', objPath, e)
        signedUrls.push({ objectPath: objPath })
      }
    }

    return NextResponse.json({ success: true, data: signedUrls })

  } catch (error) {
    console.error('Error in admin receipts API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
