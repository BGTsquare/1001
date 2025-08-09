import { NextResponse } from 'next/server'
import { withAdminAuth, type AuthenticatedRequest } from '@/lib/middleware/auth-middleware'
import { PendingBooksService } from '@/lib/services/pending-books-service'

async function getPendingBooksHandler(request: AuthenticatedRequest): Promise<NextResponse> {
  try {
    const pendingBooksService = new PendingBooksService()
    const result = await pendingBooksService.getPendingBooks()

    if (!result.success) {
      console.error('PendingBooksService error:', result.error)
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      books: result.data.books,
      total: result.data.total
    })
  } catch (error) {
    console.error('Unexpected error in getPendingBooksHandler:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export const GET = withAdminAuth(getPendingBooksHandler)