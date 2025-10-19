import { createRouteHandlerClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies })
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const { storage_path } = await request.json()
  if (!storage_path) {
    return new NextResponse('Storage path is required', { status: 400 })
  }

  try {
    const { data, error } = await supabase
      .from('manual_payment_submissions')
      .insert([
        { user_id: user.id, storage_path },
      ])
      .select()
      .single()

    if (error) {
      console.error('Error creating submission:', error)
      return new NextResponse('Could not create submission', { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('An unexpected error occurred:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
