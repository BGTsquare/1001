'use client'

import { forwardRef } from 'react'

interface ReaderContentProps {
  content: string
  fontSizeClasses: string
  fontFamilyClasses: string
  isLoading: boolean
}

export const ReaderContent = forwardRef<HTMLDivElement, ReaderContentProps>(
  ({ content, fontSizeClasses, fontFamilyClasses, isLoading }, ref) => {
    if (isLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading book content...</p>
          </div>
        </div>
      )
    }

    return (
      <main className="content-mobile">
        <div
          ref={ref}
          className={`
            reading-container h-[calc(100vh-6rem)] sm:h-[calc(100vh-3.5rem)] overflow-y-auto
            ${fontSizeClasses} ${fontFamilyClasses}
          `}
          style={{ scrollBehavior: 'smooth' }}
        >
          {content ? (
            <div 
              className="prose prose-sm sm:prose-lg max-w-none prose-headings:text-mobile-lg sm:prose-headings:text-xl prose-p:text-mobile-base sm:prose-p:text-base prose-p:leading-relaxed"
              dangerouslySetInnerHTML={{ __html: content }}
            />
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-mobile-base">No content available for this book.</p>
            </div>
          )}
        </div>
      </main>
    )
  }
)

ReaderContent.displayName = 'ReaderContent'