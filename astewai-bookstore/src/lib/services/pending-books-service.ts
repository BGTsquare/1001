import { createClient } from '@/lib/supabase/server'

export interface PendingBook {
  id: string
  title: string
  author: string
  description: string
  price: number
  is_free: boolean
  category: string
  tags: string[]
  created_at: string
  updated_at: string
  status: 'pending' | 'approved' | 'rejected'
  submitted_at: string
  reviewed_at: string | null
  reviewer_notes: string | null
}

export interface PendingBooksResult {
  books: PendingBook[]
  total: number
}

export class PendingBooksService {
  async getPendingBooks(): Promise<{ success: true; data: PendingBooksResult } | { success: false; error: string }> {
    try {
      const supabase = await createClient()
      
      // TODO: Replace with actual status field when implemented in database
      // For now, we'll simulate pending books by returning all books
      const { data: books, error } = await supabase
        .from('books')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching pending books:', error)
        return { success: false, error: 'Failed to fetch pending books' }
      }

      if (!books) {
        return {
          success: true,
          data: {
            books: [],
            total: 0
          }
        }
      }

      // TODO: Remove simulation when actual status field is implemented
      const booksWithStatus: PendingBook[] = books.map(book => ({
        ...book,
        status: Math.random() > 0.7 ? 'pending' : 'approved', // Random status for demo
        submitted_at: book.created_at,
        reviewed_at: Math.random() > 0.5 ? book.updated_at : null,
        reviewer_notes: Math.random() > 0.8 ? 'Looks good for publication' : null
      }))

      // Filter to only show pending books
      const pendingBooks = booksWithStatus.filter(book => book.status === 'pending')

      return {
        success: true,
        data: {
          books: pendingBooks,
          total: pendingBooks.length
        }
      }
    } catch (error) {
      console.error('Unexpected error in getPendingBooks:', error)
      return { success: false, error: 'Internal server error' }
    }
  }

  async approveBook(bookId: string, reviewerNotes?: string): Promise<{ success: boolean; error?: string }> {
    try {
      const supabase = await createClient()
      
      // TODO: Implement when status field is added to database
      // const { error } = await supabase
      //   .from('books')
      //   .update({
      //     status: 'approved',
      //     reviewed_at: new Date().toISOString(),
      //     reviewer_notes: reviewerNotes
      //   })
      //   .eq('id', bookId)

      // For now, just return success
      return { success: true }
    } catch (error) {
      console.error('Error approving book:', error)
      return { success: false, error: 'Failed to approve book' }
    }
  }

  async rejectBook(bookId: string, reviewerNotes?: string): Promise<{ success: boolean; error?: string }> {
    try {
      const supabase = await createClient()
      
      // TODO: Implement when status field is added to database
      // const { error } = await supabase
      //   .from('books')
      //   .update({
      //     status: 'rejected',
      //     reviewed_at: new Date().toISOString(),
      //     reviewer_notes: reviewerNotes
      //   })
      //   .eq('id', bookId)

      // For now, just return success
      return { success: true }
    } catch (error) {
      console.error('Error rejecting book:', error)
      return { success: false, error: 'Failed to reject book' }
    }
  }
}