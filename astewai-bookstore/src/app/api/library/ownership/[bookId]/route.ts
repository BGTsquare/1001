import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { libraryService } from '@/lib/services/library-service'

export async function GET(
  request: NextRequest,
  { params }: { params: { bookId: string } }
) {
  try {
    const { bookId } = await params
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { owned: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check book ownership
    const result = await libraryService.checkBookOwnership(user.id, bookId)

    if (!result.success) {
      return NextResponse.json(
        { owned: false, error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json({
      owned: result.data?.owned || false,
      status: result.data?.status,
      progress: result.data?.progress
    })

  } catch (error) {
    console.error('Error checking book ownership:', error)
    return NextResponse.json(
      { owned: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}