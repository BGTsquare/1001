'use client'

import { useEffect, useState } from 'react'
import { OptimizedImage, BookCoverImage } from '@/components/ui/optimized-image'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface Book {
  id: string
  title: string
  author: string
  cover_image_url?: string
}

export default function DebugImagesPage() {
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const response = await fetch('/api/books')
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const data = await response.json()
        console.log('Books data:', data)
        setBooks(data.books || [])
      } catch (err) {
        console.error('Error fetching books:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchBooks()
  }, [])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Debug Images - Loading...</h1>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Debug Images - Error</h1>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Error: {error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Debug Images</h1>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Books Found: {books.length}</h2>
        
        {books.length === 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800">No books found in the database.</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {books.map((book) => (
          <Card key={book.id} className="overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{book.title}</CardTitle>
              <p className="text-sm text-muted-foreground">by {book.author}</p>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Image URL Info */}
              <div className="text-xs bg-gray-50 p-2 rounded">
                <strong>Cover URL:</strong>
                <br />
                {book.cover_image_url ? (
                  <a 
                    href={book.cover_image_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline break-all"
                  >
                    {book.cover_image_url}
                  </a>
                ) : (
                  <span className="text-red-600">No cover URL</span>
                )}
              </div>

              {/* Test BookCoverImage Component */}
              <div>
                <h4 className="text-sm font-medium mb-2">BookCoverImage Component:</h4>
                <div className="aspect-[3/4] w-full max-w-[200px] bg-gray-100 rounded">
                  <BookCoverImage
                    src={book.cover_image_url}
                    title={book.title}
                    className="rounded"
                  />
                </div>
              </div>

              {/* Test OptimizedImage Component */}
              {book.cover_image_url && (
                <div>
                  <h4 className="text-sm font-medium mb-2">OptimizedImage Component:</h4>
                  <div className="aspect-[3/4] w-full max-w-[200px] bg-gray-100 rounded relative">
                    <OptimizedImage
                      src={book.cover_image_url}
                      alt={`Cover of ${book.title}`}
                      fill
                      className="object-cover rounded"
                      fallback={
                        <div className="flex h-full items-center justify-center bg-red-50 rounded">
                          <span className="text-red-600 text-xs">Failed to load</span>
                        </div>
                      }
                    />
                  </div>
                </div>
              )}

              {/* Test Direct Image */}
              {book.cover_image_url && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Direct HTML img:</h4>
                  <div className="aspect-[3/4] w-full max-w-[200px] bg-gray-100 rounded overflow-hidden">
                    <img
                      src={book.cover_image_url}
                      alt={`Cover of ${book.title}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        console.error(`Failed to load image for ${book.title}:`, book.cover_image_url)
                        e.currentTarget.style.display = 'none'
                      }}
                      onLoad={() => {
                        console.log(`Successfully loaded image for ${book.title}:`, book.cover_image_url)
                      }}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Test Sample Unsplash Images */}
      <div className="mt-12">
        <h2 className="text-xl font-semibold mb-4">Test Sample Images</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=600&fit=crop&crop=center',
            'https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=400&h=600&fit=crop&crop=center',
            'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=400&h=600&fit=crop&crop=center',
            'https://images.unsplash.com/photo-1556075798-4825dfaaf498?w=400&h=600&fit=crop&crop=center'
          ].map((url, index) => (
            <div key={index} className="aspect-[3/4] bg-gray-100 rounded overflow-hidden">
              <img
                src={url}
                alt={`Test image ${index + 1}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  console.error(`Failed to load test image ${index + 1}:`, url)
                  e.currentTarget.style.display = 'none'
                }}
                onLoad={() => {
                  console.log(`Successfully loaded test image ${index + 1}:`, url)
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
