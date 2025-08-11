import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { bookService } from '@/lib/services/book-service'
import { libraryService } from '@/lib/services/library-service'
import { BookReader } from '@/components/books/book-reader'

interface ReadPageProps {
  params: {
    id: string
  }
}

export default async function ReadPage({ params }: ReadPageProps) {
  const { id } = await params
  const supabase = await createClient()
  
  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    redirect('/auth/login?redirect=/books/' + id + '/read')
  }

  // Get book details
  const bookResult = await bookService.getBookById(id)
  
  if (!bookResult.success || !bookResult.data) {
    notFound()
  }

  const book = bookResult.data

  // Check if user owns the book or if it's free
  if (!book.is_free) {
    const ownershipResult = await libraryService.checkBookOwnership(user.id, id)
    
    if (!ownershipResult.success || !ownershipResult.data?.owned) {
      redirect('/books/' + id + '?error=not-owned')
    }
  }

  // Get library item for progress tracking
  const libraryResult = await libraryService.getLibraryItem(user.id, id)
  
  if (!libraryResult.success || !libraryResult.data) {
    // If book is free but not in library, add it
    if (book.is_free) {
      const addResult = await libraryService.addBookToLibrary(user.id, id, 'owned')
      if (addResult.success && addResult.data) {
        // Redirect to reload with library item
        redirect('/books/' + id + '/read')
      }
    }
    
    redirect('/books/' + id + '?error=library-error')
  }

  const libraryItem = libraryResult.data

  return (
    <BookReader 
      book={book} 
      libraryItem={libraryItem}
    />
  )
}

export async function generateMetadata({ params }: ReadPageProps) {
  const { id } = await params
  const bookResult = await bookService.getBookById(id)
  
  if (!bookResult.success || !bookResult.data) {
    return {
      title: 'Book Not Found',
    }
  }

  const book = bookResult.data
  
  return {
    title: `Reading: ${book.title} | Astewai`,
    description: `Read ${book.title} by ${book.author} on Astewai Digital Bookstore`,
    robots: 'noindex, nofollow', // Don't index reader pages
  }
}