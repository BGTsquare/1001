import { supabaseAdmin } from '@/lib/supabase/admin'
import { createRouteHandlerClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createRouteHandlerClient({ cookies })
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  // Check if the user is an admin before proceeding
  const { data: isAdmin, error: adminError } = await supabase.rpc('is_admin')
  if (adminError || !isAdmin) {
    return new NextResponse('Forbidden', { status: 403 })
  }

  const { status } = await request.json()
  if (!['approved', 'rejected'].includes(status)) {
    return new NextResponse('Invalid status', { status: 400 })
  }

  const submissionId = params.id

  try {
    const { data, error } = await supabaseAdmin
      .from('manual_payment_submissions')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', submissionId)
      .select()
      .single()

    if (error) {
      console.error('Error updating submission:', error)
      return new NextResponse('Could not update submission', { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('An unexpected error occurred:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
