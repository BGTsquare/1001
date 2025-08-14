import { useState, useCallback } from 'react'
import { toast } from 'sonner'

export interface Bookmark {
  id: string
  position: string
  text: string
  created_at: string
}

interface UseBookmarksReturn {
  bookmarks: Bookmark[]
  addBookmark: (position: string) => void
  goToBookmark: (bookmark: Bookmark, restorePosition: (position: string) => void) => void
  removeBookmark: (bookmarkId: string) => void
}

export function useBookmarks(): UseBookmarksReturn {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])

  // Add bookmark
  const addBookmark = useCallback((position: string) => {
    const selection = window.getSelection()
    const selectedText = selection?.toString().slice(0, 100) || 'Bookmark'

    const bookmark: Bookmark = {
      id: Date.now().toString(),
      position,
      text: selectedText,
      created_at: new Date().toISOString()
    }

    setBookmarks(prev => [...prev, bookmark])
    toast.success('Bookmark added')
  }, [])

  // Navigate to bookmark
  const goToBookmark = useCallback((bookmark: Bookmark, restorePosition: (position: string) => void) => {
    restorePosition(bookmark.position)
  }, [])

  // Remove bookmark
  const removeBookmark = useCallback((bookmarkId: string) => {
    setBookmarks(prev => prev.filter(b => b.id !== bookmarkId))
    toast.success('Bookmark removed')
  }, [])

  return {
    bookmarks,
    addBookmark,
    goToBookmark,
    removeBookmark
  }
}