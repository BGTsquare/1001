import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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
    const { reading_preferences } = body

    if (!reading_preferences) {
      return NextResponse.json(
        { error: 'Reading preferences are required' },
        { status: 400 }
      )
    }

    // Validate reading preferences structure
    const validFontSizes = ['small', 'medium', 'large']
    const validThemes = ['light', 'dark', 'sepia']
    const validFontFamilies = ['serif', 'sans-serif', 'monospace']

    if (reading_preferences.fontSize && !validFontSizes.includes(reading_preferences.fontSize)) {
      return NextResponse.json(
        { error: 'Invalid font size' },
        { status: 400 }
      )
    }

    if (reading_preferences.theme && !validThemes.includes(reading_preferences.theme)) {
      return NextResponse.json(
        { error: 'Invalid theme' },
        { status: 400 }
      )
    }

    if (reading_preferences.fontFamily && !validFontFamilies.includes(reading_preferences.fontFamily)) {
      return NextResponse.json(
        { error: 'Invalid font family' },
        { status: 400 }
      )
    }

    // Update user profile with new reading preferences
    const { data, error } = await supabase
      .from('profiles')
      .update({
        reading_preferences,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating reading preferences:', error)
      return NextResponse.json(
        { error: 'Failed to update reading preferences' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data,
      message: 'Reading preferences updated successfully'
    })

  } catch (error) {
    console.error('Error updating reading preferences:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}