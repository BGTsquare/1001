import { NextResponse } from 'next/server'
import { withAdminAuth, type AuthenticatedRequest } from '@/lib/middleware/auth-middleware'
import { StorageService } from '@/lib/services/storage-service'
import { BUCKET_CONFIGS } from '@/lib/config/storage'

/**
 * POST /api/admin/setup/storage
 * 
 * Sets up the books storage bucket for the application.
 * Requires admin authentication.
 * 
 * @returns 201 if bucket was created, 200 if already exists
 */
export const POST = withAdminAuth(async (request: AuthenticatedRequest) => {
  try {
    const storageService = await StorageService.create()
    
    // Setup the books bucket using predefined configuration
    const result = await storageService.setupBucket(BUCKET_CONFIGS.BOOKS)
    
    // Log successful setup for audit purposes
    console.info('Storage setup completed:', {
      bucketId: BUCKET_CONFIGS.BOOKS.id,
      created: result.created,
      adminUserId: request.user.id,
      timestamp: new Date().toISOString()
    })
    
    const statusCode = result.created ? 201 : 200
    return NextResponse.json(result, { status: statusCode })

  } catch (error) {
    // Enhanced error logging with context
    console.error('Storage setup failed:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      bucketId: BUCKET_CONFIGS.BOOKS.id,
      adminUserId: request.user?.id,
      timestamp: new Date().toISOString()
    })
    
    return NextResponse.json(
      { 
        error: 'Failed to setup storage bucket',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
})