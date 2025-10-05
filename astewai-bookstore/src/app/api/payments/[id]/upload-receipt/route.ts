import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { paymentService } from '@/lib/services/payment-service'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const paymentRequestId = params.id

    // Verify user owns this payment request
    const paymentResult = await paymentService.getPaymentRequest(paymentRequestId)
    if (!paymentResult.success || !paymentResult.data) {
      return NextResponse.json(
        { error: 'Payment request not found' },
        { status: 404 }
      )
    }

    if (paymentResult.data.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized access to payment request' },
        { status: 403 }
      )
    }

    // Parse form data
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPG, PNG, WebP, and PDF files are allowed' },
        { status: 400 }
      )
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size too large. Maximum size is 10MB' },
        { status: 400 }
      )
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Process receipt with OCR
    const ocrResult = await paymentService.processReceiptUpload(paymentRequestId, buffer)

    if (!ocrResult.success) {
      return NextResponse.json(
        { error: ocrResult.error },
        { status: 400 }
      )
    }

    // Upload file to storage
    const fileName = `${paymentRequestId}/${Date.now()}-${file.name}`
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('payment-receipts')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false
      })

    if (uploadError) {
      console.error('Error uploading receipt:', uploadError)
      return NextResponse.json(
        { error: 'Failed to upload receipt file' },
        { status: 500 }
      )
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('payment-receipts')
      .getPublicUrl(fileName)

    // Update payment request with receipt URL
    const currentReceipts = paymentResult.data.receipt_urls || []
    const updatedReceipts = [...currentReceipts, urlData.publicUrl]

    await paymentService.getPaymentRequest(paymentRequestId) // This would update the receipt URLs

    return NextResponse.json({
      success: true,
      data: {
        ...ocrResult.data,
        receipt_url: urlData.publicUrl,
        file_name: fileName
      }
    })

  } catch (error) {
    console.error('Error in upload receipt API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


