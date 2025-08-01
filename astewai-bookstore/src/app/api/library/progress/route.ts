import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { libraryService } from '@/lib/services/library-service'
import { validateProgress } from '@/lib/validation/library-validation'

export async function PUT(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { bookId, progress, lastReadPosition } = body

    // Validate required fields
    if (!bookId) {
      return NextResponse.json(
        { error: 'Book ID is required' },
        { status: 400 }
      )
    }

    if (progress === undefined || progress === null) {
      return NextResponse.json(
        { error: 'Progress is required' },
        { status: 400 }
      )
    }

    // Validate progress value
    const progressValidation = validateProgress(progress)
    if (!progressValidation.isValid) {
      return NextResponse.json(
        { error: progressValidation.error },
        { status: 400 }
      )
    }

    // Update reading progress
    const result = await libraryService.updateReadingProgress(
      user.id,
      bookId,
      progress,
      lastReadPosition
    )

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to update reading progress' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      statusChanged: result.statusChanged,
      message: 'Reading progress updated successfully'
    })

  } catch (error) {
    console.error('Error updating reading progress:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}