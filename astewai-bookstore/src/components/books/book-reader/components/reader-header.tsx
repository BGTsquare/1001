'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft, Settings, Bookmark, BookmarkPlus, Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import type { Book } from '@/types'

interface ReaderHeaderProps {
  book: Book
  currentProgress: number
  isFullscreen: boolean
  showSettings: boolean
  showBookmarks: boolean
  onAddBookmark: () => void
  onToggleBookmarks: () => void
  onToggleSettings: () => void
  onToggleFullscreen: () => void
}

export function ReaderHeader({
  book,
  currentProgress,
  isFullscreen,
  showSettings,
  showBookmarks,
  onAddBookmark,
  onToggleBookmarks,
  onToggleSettings,
  onToggleFullscreen
}: ReaderHeaderProps) {
  const router = useRouter()

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 safe-area-top">
      <div className="container-mobile flex h-12 sm:h-14 items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="flex items-center gap-2 touch-target flex-shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back</span>
          </Button>
          
          <div className="hidden sm:block min-w-0 flex-1">
            <h1 className="font-semibold truncate text-mobile-base">{book.title}</h1>
            <p className="text-mobile-xs text-muted-foreground truncate">by {book.author}</p>
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          {/* Progress indicator */}
          <div className="hidden sm:flex items-center gap-2 min-w-[120px]">
            <Progress value={currentProgress} className="w-20" />
            <span className="text-mobile-xs text-muted-foreground">
              {Math.round(currentProgress)}%
            </span>
          </div>

          {/* Reader controls */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onAddBookmark}
            title="Add bookmark"
            className="touch-target"
          >
            <BookmarkPlus className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleBookmarks}
            title="View bookmarks"
            className={`touch-target ${showBookmarks ? 'bg-muted' : ''}`}
          >
            <Bookmark className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleSettings}
            title="Reader settings"
            className={`touch-target ${showSettings ? 'bg-muted' : ''}`}
          >
            <Settings className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleFullscreen}
            title="Toggle fullscreen"
            className="touch-target hidden sm:flex"
          >
            {isFullscreen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Mobile header info and progress */}
      <div className="sm:hidden px-4 pb-3 border-t bg-muted/30">
        <div className="flex items-center justify-between mb-2">
          <div className="min-w-0 flex-1">
            <h1 className="font-semibold truncate text-mobile-sm">{book.title}</h1>
            <p className="text-mobile-xs text-muted-foreground truncate">by {book.author}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Progress value={currentProgress} className="flex-1" />
          <span className="text-mobile-xs text-muted-foreground min-w-[40px]">
            {Math.round(currentProgress)}%
          </span>
        </div>
      </div>
    </header>
  )
}