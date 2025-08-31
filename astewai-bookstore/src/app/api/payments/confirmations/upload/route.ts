import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { BUCKET_CONFIGS } from '@/lib/config/storage'
import { createEmailNotificationService } from '@/lib/services/email-notification-service'
import { fileSecurityValidator } from '@/lib/security/file-security'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']

interface UploadError {
  message: string
  status: number
  code?: string
}

function createError(message: string, status: number, code?: string): UploadError {
  return { message, status, code }
}

async function validateRequest(request: NextRequest) {
  const supabase = await createClient()
  
  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    throw createError('Authentication required', 401, 'AUTH_REQUIRED')
  }

  return { supabase, user }
}

async function validateFile(file: File): Promise<{ sanitizedFileName?: string; fileHash?: string }> {
  // Perform comprehensive security validation
  const securityCheck = await fileSecurityValidator.validateFile(file)

  if (!securityCheck.isValid) {
    throw createError(
      `File validation failed: ${securityCheck.errors.join(', ')}`,
      400,
      'FILE_VALIDATION_FAILED'
    )
  }

  // Log warnings if any
  if (securityCheck.warnings && securityCheck.warnings.length > 0) {
    console.warn('File validation warnings:', securityCheck.warnings)
  }

  // Basic checks (kept for backward compatibility)
  if (file.size > MAX_FILE_SIZE) {
    throw createError(
      `File size must be less than ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
      400,
      'FILE_TOO_LARGE'
    )
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    throw createError(
      'Only JPG, PNG, WebP, and PDF files are allowed',
      400,
      'INVALID_FILE_TYPE'
    )
  }

  if (file.size === 0) {
    throw createError('File cannot be empty', 400, 'EMPTY_FILE')
  }

  return {
    sanitizedFileName: securityCheck.sanitizedFileName,
    fileHash: securityCheck.fileHash
  }
}

async function validatePurchaseRequest(
  supabase: any,
  userId: string,
  purchaseRequestId: string
) {
  const { data: purchaseRequest, error } = await supabase
    .from('purchase_requests')
    .select('id, user_id, status, amount, item_type, item_id')
    .eq('id', purchaseRequestId)
    .eq('user_id', userId)
    .single()

  if (error || !purchaseRequest) {
    throw createError('Purchase request not found', 404, 'PURCHASE_NOT_FOUND')
  }

  // Check if purchase request is in a valid state for confirmation upload
  if (!['pending', 'contacted'].includes(purchaseRequest.status)) {
    throw createError(
      'Payment confirmations can only be uploaded for pending or contacted requests',
      400,
      'INVALID_STATUS'
    )
  }

  return purchaseRequest
}

async function generateFilePath(
  supabase: any,
  userId: string,
  purchaseRequestId: string,
  fileName: string
): Promise<string> {
  // Extract file extension
  const fileExtension = fileName.split('.').pop()?.toLowerCase() || 'unknown'
  
  // Use the database function to generate secure path
  const { data, error } = await supabase
    .rpc('generate_payment_confirmation_path', {
      user_id: userId,
      purchase_request_id: purchaseRequestId,
      file_extension: fileExtension
    })

  if (error || !data) {
    throw createError('Failed to generate file path', 500, 'PATH_GENERATION_FAILED')
  }

  return data
}

async function uploadToStorage(
  supabase: any,
  file: File,
  filePath: string
): Promise<string> {
  // Convert file to buffer
  const arrayBuffer = await file.arrayBuffer()
  const buffer = new Uint8Array(arrayBuffer)

  // Upload to Supabase storage
  const { data, error } = await supabase.storage
    .from('payment-confirmations')
    .upload(filePath, buffer, {
      contentType: file.type,
      upsert: false
    })

  if (error) {
    console.error('Storage upload error:', error)
    throw createError(`Failed to upload file: ${error.message}`, 500, 'STORAGE_UPLOAD_FAILED')
  }

  // Get the public URL (even though bucket is private, we need the path)
  const { data: { publicUrl } } = supabase.storage
    .from('payment-confirmations')
    .getPublicUrl(filePath)

  return publicUrl
}

async function saveConfirmationRecord(
  supabase: any,
  userId: string,
  purchaseRequestId: string,
  file: File,
  filePath: string,
  fileUrl: string,
  clientIP?: string,
  userAgent?: string
) {
  const { data, error } = await supabase
    .from('payment_confirmations')
    .insert({
      purchase_request_id: purchaseRequestId,
      user_id: userId,
      file_name: file.name,
      file_path: filePath,
      file_size: file.size,
      file_type: file.type,
      upload_ip: clientIP,
      user_agent: userAgent,
      status: 'pending'
    })
    .select()
    .single()

  if (error) {
    console.error('Database insert error:', error)
    throw createError('Failed to save confirmation record', 500, 'DATABASE_INSERT_FAILED')
  }

  return data
}

export async function POST(request: NextRequest) {
  try {
    // Validate authentication
    const { supabase, user } = await validateRequest(request)

    // Parse form data
    const formData = await request.formData()
    const file = formData.get('file') as File
    const purchaseRequestId = formData.get('purchaseRequestId') as string
    const transactionReference = formData.get('transactionReference') as string

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    if (!purchaseRequestId) {
      return NextResponse.json(
        { error: 'Purchase request ID is required' },
        { status: 400 }
      )
    }

    // Validate file with security checks
    const validationResult = await validateFile(file)

    // Validate purchase request
    const purchaseRequest = await validatePurchaseRequest(
      supabase,
      user.id,
      purchaseRequestId
    )

    // Generate secure file path using sanitized filename
    const fileName = validationResult.sanitizedFileName || file.name
    const filePath = await generateFilePath(supabase, user.id, purchaseRequestId, fileName)

    // Upload file to storage
    const fileUrl = await uploadToStorage(supabase, file, filePath)

    // Get client information for audit
    const clientIP = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // Save confirmation record
    const confirmationRecord = await saveConfirmationRecord(
      supabase,
      user.id,
      purchaseRequestId,
      file,
      filePath,
      fileUrl,
      clientIP,
      userAgent
    )

    // Log successful upload
    console.log(`Payment confirmation uploaded: ${confirmationRecord.id} by user ${user.id}`)

    // Send email notifications
    try {
      const emailService = createEmailNotificationService()

      // Notify admin about new payment confirmation
      await emailService.sendPaymentConfirmationUploadedNotification(purchaseRequest, 1)

      // Notify user that confirmation was received
      await emailService.sendPaymentConfirmationReceivedNotification(purchaseRequest)
    } catch (emailError) {
      console.error('Failed to send email notifications:', emailError)
      // Don't fail the upload if email fails
    }

    return NextResponse.json({
      success: true,
      data: {
        id: confirmationRecord.id,
        url: fileUrl,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        status: confirmationRecord.status,
        uploadedAt: confirmationRecord.created_at
      }
    })

  } catch (error) {
    console.error('Payment confirmation upload error:', error)

    if (error instanceof Error && 'status' in error) {
      const uploadError = error as UploadError
      return NextResponse.json(
        { error: uploadError.message, code: uploadError.code },
        { status: uploadError.status }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
