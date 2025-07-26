'use client'

import { useState, useEffect } from 'react'
import { X, BookOpen, Loader2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Book } from '@/types'

interface BookPreviewProps {
  book: Book
  isOpen: boolean
  onClose: () => void
}

interface PreviewContent {
  title: string
  content: string
  totalPages?: number
  previewPages?: number
}

export function BookPreview({ book, isOpen, onClose }: BookPreviewProps) {
  const [previewContent, setPreviewContent] = useState<PreviewContent | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && book.content_url) {
      fetchPreviewContent()
    }
  }, [isOpen, book.content_url])

  const fetchPreviewContent = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/books/${book.id}/preview`)
      
      if (!response.ok) {
        throw new Error('Failed to load preview')
      }
      
      const data = await response.json()
      setPreviewContent(data)
    } catch (error) {
      console.error('Error fetching preview:', error)
      setError(error instanceof Error ? error.message : 'Failed to load preview')
      
      // Fallback to mock preview content for demonstration
      setTimeout(() => {
        setPreviewContent({
          title: book.title,
          content: generateMockPreview(book),
          totalPages: 250,
          previewPages: 25
        })
      }, 100)
    } finally {
      setIsLoading(false)
    }
  }

  const generateMockPreview = (book: Book): string => {
    return `# ${book.title}
*by ${book.author}*

---

## Chapter 1: Introduction

${book.description || 'Welcome to this fascinating journey through the pages of this remarkable book. In this opening chapter, we begin to explore the themes and ideas that will guide us throughout our reading experience.'}

This preview gives you a taste of what's to come in the full book. The complete version contains much more detailed content, additional chapters, and comprehensive coverage of all topics.

---

## What You'll Find in the Full Book

- Comprehensive coverage of all topics
- Detailed examples and case studies  
- Practical exercises and applications
- Additional resources and references
- And much more...

---

*This is a limited preview. Purchase the full book to access all content.*`
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] flex flex-col">
        <CardHeader className="flex-shrink-0 flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Book Preview: {book.title}
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="flex-1 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                <p className="text-muted-foreground">Loading preview...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-4" />
                <p className="text-destructive mb-2">Failed to load preview</p>
                <p className="text-muted-foreground text-sm">{error}</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-4"
                  onClick={fetchPreviewContent}
                >
                  Try Again
                </Button>
              </div>
            </div>
          ) : previewContent ? (
            <div className="h-full flex flex-col">
              {/* Preview Info */}
              {previewContent.totalPages && previewContent.previewPages && (
                <div className="bg-muted/50 rounded-lg p-3 mb-4 text-sm">
                  <p className="text-muted-foreground">
                    Preview: {previewContent.previewPages} of {previewContent.totalPages} pages
                  </p>
                </div>
              )}
              
              {/* Preview Content */}
              <div className="flex-1 overflow-y-auto">
                <div className="prose prose-gray max-w-none">
                  {previewContent.content.split('\n').map((line, index) => {
                    if (line.startsWith('# ')) {
                      return (
                        <h1 key={index} className="text-2xl font-bold mb-4 mt-6 first:mt-0">
                          {line.substring(2)}
                        </h1>
                      )
                    }
                    if (line.startsWith('## ')) {
                      return (
                        <h2 key={index} className="text-xl font-semibold mb-3 mt-5">
                          {line.substring(3)}
                        </h2>
                      )
                    }
                    if (line.startsWith('*') && line.endsWith('*')) {
                      return (
                        <p key={index} className="italic text-muted-foreground mb-3">
                          {line.substring(1, line.length - 1)}
                        </p>
                      )
                    }
                    if (line === '---') {
                      return <hr key={index} className="my-6 border-border" />
                    }
                    if (line.startsWith('- ')) {
                      return (
                        <li key={index} className="ml-4 mb-1">
                          {line.substring(2)}
                        </li>
                      )
                    }
                    if (line.trim() === '') {
                      return <br key={index} />
                    }
                    return (
                      <p key={index} className="mb-4 leading-relaxed">
                        {line}
                      </p>
                    )
                  })}
                </div>
              </div>
              
              {/* Preview Footer */}
              <div className="border-t pt-4 mt-4 flex justify-between items-center">
                <p className="text-sm text-muted-foreground">
                  This is a limited preview. Get the full book for complete content.
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={onClose}>
                    Close Preview
                  </Button>
                  <Button onClick={onClose}>
                    {book.is_free ? 'Add to Library' : 'Buy Now'}
                  </Button>
                </div>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}