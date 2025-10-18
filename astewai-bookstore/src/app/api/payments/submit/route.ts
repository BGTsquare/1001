import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { paymentService } from '@/lib/services/payment-service'
import { paymentRepository } from '@/lib/repositories/payment-repository'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Auth
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const formData = await request.formData()
    const bookId = formData.get('bookId') as string | null
    const method = (formData.get('method') as string | null) || 'other'
    const amountRaw = formData.get('amount') as string | null
    const file = formData.get('receipt') as File | null

    if (!bookId || typeof bookId !== 'string') {
      return NextResponse.json({ error: 'Missing bookId' }, { status: 400 })
    }

    if (!amountRaw) {
      return NextResponse.json({ error: 'Missing amount' }, { status: 400 })
    }

    const amount = Number(amountRaw)
    if (Number.isNaN(amount) || amount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
    }

    // Initiate payment request
    const initResult = await paymentService.initiatePayment(user.id, {
      item_type: 'book',
      item_id: bookId,
      amount,
      currency: 'ETB'
    })

    if (!initResult.success || !initResult.data) {
      return NextResponse.json({ error: initResult.error || 'Failed to create payment request' }, { status: 400 })
    }

    const paymentRequest = initResult.data.paymentRequest

    let publicUrl: string | undefined
    let ocrResult: any | undefined

    if (file) {
      // Validate file type and size (allow only JPG, PNG, PDF)
      const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf']
      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json({ error: 'Invalid file type. Only JPG, PNG and PDF allowed' }, { status: 400 })
      }

      const maxSize = 5 * 1024 * 1024 // 5MB
      if (file.size > maxSize) {
        return NextResponse.json({ error: 'File size too large. Maximum is 5MB' }, { status: 400 })
      }

      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)

      // Upload to storage (store object path; do not rely on public URL)
      const fileName = `${paymentRequest.id}/${Date.now()}-${file.name}`
      const { error: uploadError } = await supabase.storage
        .from('payment-receipts')
        .upload(fileName, buffer, {
          contentType: file.type,
          upsert: false
        })

      if (uploadError) {
        console.error('Error uploading receipt:', uploadError)
        return NextResponse.json({ error: 'Failed to upload receipt' }, { status: 500 })
      }

      // Store object path instead of public URL
      const objectPath = fileName

      // Update payment request with receipt object path
      const currentReceipts = paymentRequest.receipt_urls || []
      const updatedReceipts = [...currentReceipts, objectPath]

      await paymentRepository.updatePaymentRequest(paymentRequest.id, {
        receipt_urls: updatedReceipts
      } as any)

      // Generate a signed URL for immediate preview (expires in 1 hour)
      const { data: signedData, error: signedError } = supabase.storage
        .from('payment-receipts')
        .createSignedUrl(objectPath, 60 * 60)

      if (signedError) {
        console.error('Error creating signed URL for receipt:', signedError)
      } else {
        publicUrl = signedData.signedUrl
      }

      // Run OCR processing / auto-matching
      const ocr = await paymentService.processReceiptUpload(paymentRequest.id, buffer)
      if (ocr.success) {
        ocrResult = ocr.data
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        paymentRequestId: paymentRequest.id,
        receipt_url: publicUrl,
        ocr: ocrResult,
        method
      }
    })

  } catch (error) {
    console.error('Error in payments/submit API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
