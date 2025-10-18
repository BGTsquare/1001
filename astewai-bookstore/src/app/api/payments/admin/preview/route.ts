import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })

    // Only admins can preview
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (!profile || profile.role !== 'admin') return NextResponse.json({ error: 'Admin access required' }, { status: 403 })

    const url = new URL(req.url)
    const path = url.searchParams.get('path')
    if (!path) return NextResponse.json({ error: 'Missing path' }, { status: 400 })

    const { data: signed, error } = supabase.storage.from('payment-confirmations').createSignedUrl(path, 60 * 60)
    if (error) return NextResponse.json({ error: 'Failed to generate preview URL' }, { status: 500 })

    return NextResponse.json({ success: true, url: signed.signedUrl })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
