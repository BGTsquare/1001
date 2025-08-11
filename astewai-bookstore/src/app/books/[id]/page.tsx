import { notFound } from 'next/navigation'
import { BookDetail } from '@/components/books/book-detail'
import { bookService } from '@/lib/services/book-service'
import { generateBookMetadata } from '@/lib/seo/metadata'
import { generateBookPageStructuredData } from '@/lib/seo/page-structured-data'
import { MultipleStructuredData } from '@/components/seo/structured-data'

interface BookPageProps {
  params: {
    id: string
  }
}

/**
 * Book detail page component
 * Displays detailed information about a specific book including content preview and purchase options
 */
export default async function BookPage({ params }: BookPageProps) {
  const { id } = await params
  const result = await bookService.getBookById(id)
  
  if (!result.success || !result.data) {
    notFound()
  }

  const book = result.data

  // Generate structured data
  const structuredDataArray = generateBookPageStructuredData(book);

  return (
    <>
      <MultipleStructuredData dataArray={structuredDataArray} />
      <div className="container mx-auto px-4 py-8">
        <BookDetail book={book} />
      </div>
    </>
  )
}

/**
 * Generate metadata for book detail page
 * Creates SEO-optimized title, description, and Open Graph tags
 */
export async function generateMetadata({ params }: BookPageProps) {
  const { id } = await params
  const result = await bookService.getBookById(id)
  
  if (!result.success || !result.data) {
    return {
      title: 'Book Not Found',
    }
  }

  return generateBookMetadata(result.data)
}