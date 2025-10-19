import { createRouteHandlerClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies })
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const { fileName } = await request.json()
  if (!fileName) {
    return new NextResponse('File name is required', { status: 400 })
  }

  const filePath = `${user.id}/${Date.now()}-${fileName}`

  try {
    const { data, error } = await supabase.storage
      .from('receipts')
      .createSignedUploadUrl(filePath)

    if (error) {
      console.error('Error creating signed upload URL:', error)
      return new NextResponse('Could not create upload URL', { status: 500 })
    }

    return NextResponse.json({ ...data, filePath })
  } catch (error) {
    console.error('An unexpected error occurred:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
