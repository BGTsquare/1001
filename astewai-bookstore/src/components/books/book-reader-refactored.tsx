'use client'

import { useState } from 'react'
import type { Book, UserLibrary } from '@/types'

// Custom hooks
import { useBookContent } from './book-reader/hooks/use-book-content'
import { useReadingProgress } from './book-reader/hooks/use-reading-progress'
import { useReaderSettings } from './book-reader/hooks/use-reader-settings'
import { useBookmarks } from './book-reader/hooks/use-bookmarks'

// Components
import { ReaderHeader } from './book-reader/components/reader-header'
import { SettingsPanel } from './book-reader/components/settings-panel'
import { BookmarksPanel } from './book-reader/components/bookmarks-panel'
import { ReaderContent } from './book-reader/components/reader-content'

interface BookReaderProps {
  book: Book
  libraryItem: UserLibrary
  onProgressUpdate?: (progress: number, position: string) => void
  onStatusUpdate?: (status: 'owned' | 'pending' | 'completed') => void
}

export function BookReader({ 
  book, 
  libraryItem, 
  onProgressUpdate,
  onStatusUpdate 
}: BookReaderProps) {
  // UI state
  const [showSettings, setShowSettings] = useState(false)
  const [showBookmarks, setShowBookmarks] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Custom hooks for business logic
  const { content, isLoading } = useBookContent(book, libraryItem)
  
  const {
    currentProgress,
    getCurrentReadingPosition,
    restoreReadingPosition,
    contentRef
  } = useReadingProgress({
    book,
    libraryItem,
    onProgressUpdate,
    onStatusUpdate
  })

  const {
    settings,
    updateSettings,
    getThemeClasses,
    getFontSizeClasses,
    getFontFamilyClasses
  } = useReaderSettings()

  const {
    bookmarks,
    addBookmark,
    goToBookmark,
    removeBookmark
  } = useBookmarks()

  // Event handlers
  const handleAddBookmark = () => {
    const position = getCurrentReadingPosition()
    addBookmark(position)
  }

  const handleGoToBookmark = (bookmark: any) => {
    goToBookmark(bookmark, restoreReadingPosition)
    setShowBookmarks(false)
  }

  const handleToggleSettings = () => {
    setShowSettings(!showSettings)
    if (showBookmarks) setShowBookmarks(false)
  }

  const handleToggleBookmarks = () => {
    setShowBookmarks(!showBookmarks)
    if (showSettings) setShowSettings(false)
  }

  return (
    <div className={`layout-mobile ${getThemeClasses()}`}>
      <ReaderHeader
        book={book}
        currentProgress={currentProgress}
        isFullscreen={isFullscreen}
        showSettings={showSettings}
        showBookmarks={showBookmarks}
        onAddBookmark={handleAddBookmark}
        onToggleBookmarks={handleToggleBookmarks}
        onToggleSettings={handleToggleSettings}
        onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
      />

      <div className="flex">
        <SettingsPanel
          settings={settings}
          onUpdateSettings={updateSettings}
          isVisible={showSettings}
        />

        <BookmarksPanel
          bookmarks={bookmarks}
          isVisible={showBookmarks}
          onGoToBookmark={handleGoToBookmark}
          onRemoveBookmark={removeBookmark}
        />

        <ReaderContent
          ref={contentRef}
          content={content}
          fontSizeClasses={getFontSizeClasses()}
          fontFamilyClasses={getFontFamilyClasses()}
          isLoading={isLoading}
        />
      </div>
    </div>
  )
}