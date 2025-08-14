'use client'

import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import type { Bookmark } from '../hooks/use-bookmarks'

interface BookmarksPanelProps {
  bookmarks: Bookmark[]
  isVisible: boolean
  onGoToBookmark: (bookmark: Bookmark) => void
  onRemoveBookmark: (bookmarkId: string) => void
}

export function BookmarksPanel({ 
  bookmarks, 
  isVisible, 
  onGoToBookmark, 
  onRemoveBookmark 
}: BookmarksPanelProps) {
  if (!isVisible) return null

  return (
    <Card className="fixed top-12 sm:top-14 right-2 sm:right-4 z-40 w-[calc(100vw-1rem)] sm:w-80 max-h-[calc(100vh-4rem)] overflow-y-auto safe-area-right">
      <CardContent className="p-4">
        <div className="space-mobile-normal">
          <div>
            <h3 className="font-semibold mb-2 text-mobile-lg">Bookmarks</h3>
          </div>

          {bookmarks.length === 0 ? (
            <p className="text-sm text-muted-foreground">No bookmarks yet</p>
          ) : (
            <div className="space-y-2">
              {bookmarks.map((bookmark) => (
                <div
                  key={bookmark.id}
                  className="p-2 border rounded-lg group hover:bg-muted"
                >
                  <div 
                    className="cursor-pointer"
                    onClick={() => onGoToBookmark(bookmark)}
                  >
                    <p className="text-sm font-medium truncate">{bookmark.text}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(bookmark.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex justify-end mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemoveBookmark(bookmark.id)}
                      className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}