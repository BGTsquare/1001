import { BookGrid } from '@/components/books'
import { generateMetadata } from '@/lib/seo/metadata'
import { generateBreadcrumbStructuredData } from '@/lib/seo/structured-data'
import { StructuredData } from '@/components/seo/structured-data'

export const metadata = generateMetadata({
  title: 'Digital Books Collection',
  description: 'Browse our extensive collection of digital books across all genres. Find your next favorite read from bestsellers to indie gems.',
  url: '/books',
  type: 'website',
  tags: ['digital books', 'ebooks', 'online reading', 'book collection', 'fiction', 'non-fiction'],
})

export default function BooksPage() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://astewai-bookstore.com'

  const breadcrumbStructuredData = generateBreadcrumbStructuredData([
    { name: 'Home', url: baseUrl },
    { name: 'Books', url: `${baseUrl}/books` },
  ])

  return (
    <>
      <StructuredData data={breadcrumbStructuredData} id="books-breadcrumb" />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Books</h1>
          <p className="text-muted-foreground">
            Discover and browse our collection of digital books
          </p>
        </div>
        
        <BookGrid />
      </div>
    </>
  );
}
