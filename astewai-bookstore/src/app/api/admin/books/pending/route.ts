import { NextResponse } from 'next/server'
import { withAdminAuth, type AuthenticatedRequest } from '@/lib/middleware/auth-middleware'
import { PendingBooksService } from '@/lib/services/pending-books-service'

async function getPendingBooksHandler(request: AuthenticatedRequest): Promise<NextResponse> {
  const pendingBooksService = new PendingBooksService()
  const result = await pendingBooksService.getPendingBooks()

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 })
  }

  return NextResponse.json(result.data)
}

export const GET = withAdminAuth(getPendingBooksHandler)