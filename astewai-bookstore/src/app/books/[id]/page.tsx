import { notFound } from 'next/navigation'
import { BookDetail } from '@/components/books/book-detail'
import { bookService } from '@/lib/services/book-service'

interface BookPageProps {
  params: {
    id: string
  }
}

export default async function BookPage({ params }: BookPageProps) {
  const result = await bookService.getBookById(params.id)
  
  if (!result.success || !result.data) {
    notFound()
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <BookDetail book={result.data} />
    </div>
  )
}

export async function generateMetadata({ params }: BookPageProps) {
  const result = await bookService.getBookById(params.id)
  
  if (!result.success || !result.data) {
    return {
      title: 'Book Not Found',
    }
  }

  const book = result.data
  
  return {
    title: `${book.title} by ${book.author} | Astewai`,
    description: book.description || `Read ${book.title} by ${book.author} on Astewai Digital Bookstore`,
    openGraph: {
      title: book.title,
      description: book.description || `Read ${book.title} by ${book.author}`,
      images: book.cover_image_url ? [book.cover_image_url] : [],
      type: 'book',
    },
    twitter: {
      card: 'summary_large_image',
      title: book.title,
      description: book.description || `Read ${book.title} by ${book.author}`,
      images: book.cover_image_url ? [book.cover_image_url] : [],
    },
  }
}