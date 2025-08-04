import { Suspense } from 'react'
import { Metadata } from 'next'
import { AdvancedSearchPage } from '@/components/books/advanced-search-page'

export const metadata: Metadata = {
  title: 'Advanced Search - Astewai Digital Bookstore',
  description: 'Search and discover books with advanced filters, suggestions, and intelligent ranking.',
  keywords: ['book search', 'digital books', 'advanced search', 'book discovery'],
}

export default function SearchPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Advanced Search</h1>
        <p className="text-muted-foreground">
          Discover books with intelligent search, suggestions, and advanced filtering
        </p>
      </div>
      
      <Suspense fallback={
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      }>
        <AdvancedSearchPage />
      </Suspense>
    </div>
  )
}