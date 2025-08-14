'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight, Download, Share } from 'lucide-react'

interface BookReaderProps {
  content: any
  itemType: 'book' | 'bundle'
  isSecureMode?: boolean
}

export function BookReader({ content, itemType, isSecureMode = false }: BookReaderProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedBook, setSelectedBook] = useState(0)

  // Disable right-click and text selection in secure mode
  const secureProps = isSecureMode ? {
    onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
    onSelectStart: (e: React.MouseEvent) => e.preventDefault(),
    onDragStart: (e: React.MouseEvent) => e.preventDefault(),
    style: { userSelect: 'none' as const, WebkitUserSelect: 'none' as const }
  } : {}

  if (itemType === 'bundle') {
    const books = content.bundle_books?.map((bb: any) => bb.books) || []
    const currentBook = books[selectedBook]

    return (
      <div className="flex h-screen" {...secureProps}>
        {/* Bundle sidebar */}
        <div className="w-80 bg-white border-r border-gray-200 overflow-y-auto">
          <div className="p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">{content.title}</h2>
            <div className="space-y-3">
              {books.map((book: any, index: number) => (
                <button
                  key={book.id}
                  onClick={() => setSelectedBook(index)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    selectedBook === index 
                      ? 'bg-blue-50 border-blue-200 border' 
                      : 'hover:bg-gray-50 border border-transparent'
                  }`}
                >
                  <div className="font-medium text-gray-900">{book.title}</div>
                  <div className="text-sm text-gray-600">{book.author}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {book.page_count} pages
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Book content */}
        <div className="flex-1 flex flex-col">
          {currentBook && (
            <BookContent 
              book={currentBook} 
              isSecureMode={isSecureMode}
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
            />
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen" {...secureProps}>
      <BookContent 
        book={content} 
        isSecureMode={isSecureMode}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
      />
    </div>
  )
}

function BookContent({ 
  book, 
  isSecureMode, 
  currentPage, 
  setCurrentPage 
}: { 
  book: any
  isSecureMode: boolean
  currentPage: number
  setCurrentPage: (page: number) => void
}) {
  const totalPages = book.page_count || 1

  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{book.title}</h1>
            <p className="text-gray-600">{book.author}</p>
          </div>
          <div className="flex items-center space-x-4">
            {isSecureMode && (
              <div className="flex items-center space-x-2 text-sm text-orange-600 bg-orange-50 px-3 py-1 rounded-full">
                <div className="w-2 h-2 bg-orange-500 rounded-full" />
                <span>Secure Mode - No Download</span>
              </div>
            )}
            {!isSecureMode && (
              <div className="flex items-center space-x-2">
                <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg">
                  <Share className="w-5 h-5" />
                </button>
                <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg">
                  <Download className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 flex items-center justify-center bg-gray-50 p-6">
        <div className="max-w-4xl w-full bg-white rounded-lg shadow-sm border border-gray-200 min-h-[600px] p-8">
          {/* This would be replaced with actual book content rendering */}
          <div className="prose prose-lg max-w-none">
            <h2>Page {currentPage}</h2>
            <p className="text-gray-600 mb-4">
              This is a placeholder for the actual book content. In a real implementation, 
              you would load and display the actual book content from the content_url.
            </p>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">
                <strong>Book:</strong> {book.title}<br />
                <strong>Author:</strong> {book.author}<br />
                <strong>Page:</strong> {currentPage} of {totalPages}
              </p>
            </div>
            {isSecureMode && (
              <div className="mt-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <p className="text-sm text-orange-800">
                  🔒 This book is being viewed in secure mode. Content cannot be downloaded, 
                  copied, or shared. This ensures the author's intellectual property is protected.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-white border-t border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <button
            onClick={prevPage}
            disabled={currentPage === 1}
            className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-5 h-5" />
            <span>Previous</span>
          </button>

          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </span>
            <input
              type="range"
              min="1"
              max={totalPages}
              value={currentPage}
              onChange={(e) => setCurrentPage(parseInt(e.target.value))}
              className="w-32"
            />
          </div>

          <button
            onClick={nextPage}
            disabled={currentPage === totalPages}
            className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>Next</span>
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}