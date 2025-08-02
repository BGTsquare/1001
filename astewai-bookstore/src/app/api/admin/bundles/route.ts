import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { bundleService } from '@/lib/services/bundle-service'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('query') || undefined
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0
    const sortBy = searchParams.get('sortBy') as 'created_at' | 'title' | 'price' || 'created_at'
    const sortOrder = searchParams.get('sortOrder') as 'asc' | 'desc' || 'desc'

    const priceMin = searchParams.get('priceMin')
    const priceMax = searchParams.get('priceMax')
    const priceRange = priceMin && priceMax ? [parseFloat(priceMin), parseFloat(priceMax)] as [number, number] : undefined

    const result = await bundleService.searchBundles({
      query,
      limit,
      offset,
      sortBy,
      sortOrder,
      priceRange
    }, true)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json(result.data)
  } catch (error) {
    console.error('Error fetching bundles:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { title, description, price, bookIds } = body

    if (!title || !price || !bookIds || !Array.isArray(bookIds)) {
      return NextResponse.json({ 
        error: 'Missing required fields: title, price, bookIds' 
      }, { status: 400 })
    }

    const result = await bundleService.createBundle({
      title,
      description: description || null,
      price: parseFloat(price),
      bookIds
    })

    if (!result.success) {
      return NextResponse.json({ 
        error: result.error,
        validationErrors: result.validationErrors 
      }, { status: 400 })
    }

    return NextResponse.json(result.data, { status: 201 })
  } catch (error) {
    console.error('Error creating bundle:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}