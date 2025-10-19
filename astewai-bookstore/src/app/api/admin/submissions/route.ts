import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isAdmin } from '@/lib/auth/admin'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || !await isAdmin(user.id)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { submissionId, status } = await request.json()

    if (!submissionId || !status) {
      return NextResponse.json({ error: 'Missing submissionId or status' }, { status: 400 })
    }

    if (!['approved', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    // Update the submission status
    const { data: submission, error: submissionError } = await supabase
      .from('manual_payment_submissions')
      .update({ status })
      .eq('id', submissionId)
      .select()
      .single()

    if (submissionError) {
      console.error('Error updating submission:', submissionError)
      return NextResponse.json({ error: 'Failed to update submission' }, { status: 500 })
    }

    // If approved, update the payment request and grant book access
    if (status === 'approved') {
      const { error: prError } = await supabase
        .from('payment_requests')
        .update({ status: 'completed' })
        .eq('id', submission.payment_request_id)

      if (prError) {
        console.error('Error updating payment request:', prError)
        // Not returning an error to the client as the main action succeeded
      }

      const { data: prData } = await supabase
        .from('payment_requests')
        .select('item_id')
        .eq('id', submission.payment_request_id)
        .single()

      if (prData) {
        const { error: libraryError } = await supabase
          .from('user_library')
          .insert({ user_id: submission.user_id, book_id: prData.item_id })

        if (libraryError) {
          console.error('Error granting book access:', libraryError)
        }
      }
    }

    return NextResponse.json({ success: true, data: submission })
  } catch (error) {
    console.error('Error in admin/submissions API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
