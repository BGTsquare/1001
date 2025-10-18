import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const config = { api: { bodyParser: false } }

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })

    const form = await req.formData().catch(() => null)
    if (!form) return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })

    const file = form.get('receipt') as File | null
    const paymentRequestId = form.get('paymentRequestId') as string | null
    const amount = form.get('amount') as string | null

    if (!file || !(file instanceof File)) return NextResponse.json({ error: 'Missing file' }, { status: 400 })
    if (!paymentRequestId) return NextResponse.json({ error: 'Missing paymentRequestId' }, { status: 400 })

    // Basic validation
    const allowed = ['image/jpeg','image/png','application/pdf']
    if (!allowed.includes(file.type)) return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 })
    if (file.size > 10 * 1024 * 1024) return NextResponse.json({ error: 'File too large' }, { status: 400 })

    const buffer = Buffer.from(await file.arrayBuffer())
    const path = `${user.id}/${paymentRequestId}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g,'_')}`
    const { error: uploadError } = await supabase.storage.from('payment-confirmations').upload(path, buffer, { contentType: file.type })
    if (uploadError) return NextResponse.json({ error: 'Storage upload failed' }, { status: 500 })

    // Create signed URL for admin preview
    const { data: signed } = supabase.storage.from('payment-confirmations').createSignedUrl(path, 60 * 60)

    // Insert manual submission row
    const { data: insertData, error: insertError } = await supabase.from('manual_payment_submissions').insert([{ payment_request_id: paymentRequestId, user_id: user.id, amount: amount ? parseFloat(amount) : null, receipt_urls: [signed?.signedUrl], storage_paths: [path] }]).select().single()
    if (insertError) return NextResponse.json({ error: 'DB insert failed' }, { status: 500 })

    return NextResponse.json({ success: true, data: insertData })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
