import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface RouteParams {
  params: Promise<{
    purchaseRequestId: string
  }>
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const supabase = await createClient()
    const { purchaseRequestId } = await params

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check if user is admin or owns the purchase request
    const { data: purchaseRequest, error: purchaseError } = await supabase
      .from('purchase_requests')
      .select('user_id')
      .eq('id', purchaseRequestId)
      .single()

    if (purchaseError || !purchaseRequest) {
      return NextResponse.json(
        { error: 'Purchase request not found' },
        { status: 404 }
      )
    }

    // Check if user has access (owner or admin)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const isAdmin = profile?.role === 'admin'
    const isOwner = purchaseRequest.user_id === user.id

    if (!isAdmin && !isOwner) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Fetch payment confirmations
    const { data: confirmations, error } = await supabase
      .from('payment_confirmations')
      .select(`
        id,
        file_name,
        file_path,
        file_size,
        file_type,
        status,
        admin_notes,
        admin_reviewed_by,
        reviewed_at,
        created_at,
        updated_at
      `)
      .eq('purchase_request_id', purchaseRequestId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching payment confirmations:', error)
      return NextResponse.json(
        { error: 'Failed to fetch payment confirmations' },
        { status: 500 }
      )
    }

    // Generate signed URLs for file access (if user has permission)
    const confirmationsWithUrls = await Promise.all(
      confirmations.map(async (confirmation) => {
        try {
          const { data: signedUrl } = await supabase.storage
            .from('payment-confirmations')
            .createSignedUrl(confirmation.file_path, 3600) // 1 hour expiry

          return {
            ...confirmation,
            downloadUrl: signedUrl?.signedUrl || null
          }
        } catch (error) {
          console.error(`Error generating signed URL for ${confirmation.id}:`, error)
          return {
            ...confirmation,
            downloadUrl: null
          }
        }
      })
    )

    return NextResponse.json({
      success: true,
      data: confirmationsWithUrls
    })

  } catch (error) {
    console.error('Error in payment confirmations API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const supabase = await createClient()
    const { purchaseRequestId } = await params

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get confirmation ID from query params
    const url = new URL(request.url)
    const confirmationId = url.searchParams.get('confirmationId')

    if (!confirmationId) {
      return NextResponse.json(
        { error: 'Confirmation ID is required' },
        { status: 400 }
      )
    }

    // Check if user owns the confirmation or is admin
    const { data: confirmation, error: confirmationError } = await supabase
      .from('payment_confirmations')
      .select('id, user_id, file_path, status, purchase_request_id')
      .eq('id', confirmationId)
      .eq('purchase_request_id', purchaseRequestId)
      .single()

    if (confirmationError || !confirmation) {
      return NextResponse.json(
        { error: 'Payment confirmation not found' },
        { status: 404 }
      )
    }

    // Check permissions
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const isAdmin = profile?.role === 'admin'
    const isOwner = confirmation.user_id === user.id

    if (!isAdmin && !isOwner) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Only allow deletion of pending confirmations by users
    if (!isAdmin && confirmation.status !== 'pending') {
      return NextResponse.json(
        { error: 'Can only delete pending confirmations' },
        { status: 400 }
      )
    }

    // Delete file from storage
    const { error: storageError } = await supabase.storage
      .from('payment-confirmations')
      .remove([confirmation.file_path])

    if (storageError) {
      console.error('Error deleting file from storage:', storageError)
      // Continue with database deletion even if storage deletion fails
    }

    // Delete confirmation record
    const { error: deleteError } = await supabase
      .from('payment_confirmations')
      .delete()
      .eq('id', confirmationId)

    if (deleteError) {
      console.error('Error deleting payment confirmation:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete payment confirmation' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Payment confirmation deleted successfully'
    })

  } catch (error) {
    console.error('Error in DELETE payment confirmation:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
