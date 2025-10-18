import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })

    // Check admin
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (!profile || profile.role !== 'admin') return NextResponse.json({ error: 'Admin access required' }, { status: 403 })

    const body = await req.json()
    const { submissionId, approve, notes } = body
    if (!submissionId) return NextResponse.json({ error: 'Missing submissionId' }, { status: 400 })

    // Fetch submission
    const { data: submission, error: fetchError } = await supabase.from('manual_payment_submissions').select('*').eq('id', submissionId).single()
    if (fetchError || !submission) return NextResponse.json({ error: 'Submission not found' }, { status: 404 })

    // Update submission status
    const status = approve ? 'verified' : 'rejected'
    const { data: updated, error: updateError } = await supabase.from('manual_payment_submissions').update({ status, admin_notes: notes, verified_by: user.id, verified_at: new Date().toISOString() }).eq('id', submissionId).select().single()
    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })

    if (approve) {
      // Update linked payment_request as completed and grant access
      const paymentReqId = submission.payment_request_id
      const { error: prUpdateErr } = await supabase.from('payment_requests').update({ status: 'completed', admin_verified_at: new Date().toISOString(), admin_verified_by: user.id }).eq('id', paymentReqId)
      if (prUpdateErr) console.error('Failed to update payment_request status:', prUpdateErr)

      // Call RPC to grant user purchase
      const { error: rpcErr } = await supabase.rpc('grant_purchase_to_user', { p_payment_request_id: paymentReqId })
      if (rpcErr) console.error('Failed to grant purchase via RPC:', rpcErr)

      // Send email to user notifying verification (use notification service endpoint)
      try {
        // Fetch payment request details and user email
        const { data: pr } = await supabase.from('payment_requests').select('*').eq('id', paymentReqId).single()
        const { data: userInfo } = await supabase.auth.admin.getUserById(pr.user_id)
        const userEmail = userInfo.user?.email

        if (userEmail) {
          // Fire-and-forget: call internal API to send email via server service
          await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'https://astewai-bookstore.com'}/api/notifications/send`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ to: userEmail, subject: 'Payment verified', message: 'Your payment has been verified and access granted.' })
          })
        }
      } catch (e) {
        console.error('Failed to send verification email:', e)
      }
    }

    return NextResponse.json({ success: true, data: updated })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
