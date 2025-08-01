'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { 
  ArrowLeft, 
  Settings, 
  Bookmark, 
  BookmarkPlus,
  Menu,
  X,
  Sun,
  Moon,
  Type,
  Minus,
  Plus
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'

import { useAuth } from '@/contexts/auth-context'
import type { Book, UserLibrary, ReadingPreferences } from '@/types'
import { toast } from 'sonner'

interface BookReaderProps {
  book: Book
  libraryItem: UserLibrary
  onProgressUpdate?: (progress: number, position: string) => void
  onStatusUpdate?: (status: 'owned' | 'pending' | 'completed') => void
}

interface ReaderSettings extends ReadingPreferences {
  fontSize: 'small' | 'medium' | 'large'
  theme: 'light' | 'dark' | 'sepia'
  fontFamily: 'serif' | 'sans-serif' | 'monospace'
}

interface Bookmark {
  id: string
  position: string
  text: string
  created_at: string
}

export function BookReader({ 
  book, 
  libraryItem, 
  onProgressUpdate,
  onStatusUpdate 
}: BookReaderProps) {
  const { user } = useAuth()
  const router = useRouter()
  const contentRef = useRef<HTMLDivElement>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [content, setContent] = useState<string>('')
  const [currentProgress, setCurrentProgress] = useState(libraryItem.progress || 0)
  const [showSettings, setShowSettings] = useState(false)
  const [showBookmarks, setShowBookmarks] = useState(false)
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const [isFullscreen, setIsFullscreen] = useState(false)
  
  // Reader settings with defaults
  const [settings, setSettings] = useState<ReaderSettings>({
    fontSize: 'medium',
    theme: 'light',
    fontFamily: 'serif',
    ...(user?.reading_preferences as ReadingPreferences || {})
  })

  // Load book content
  useEffect(() => {
    const loadContent = async () => {
      if (!book.content_url) {
        toast.error('Book content not available')
        return
      }

      try {
        setIsLoading(true)
        const response = await fetch(`/api/books/${book.id}/content`)
        
        if (!response.ok) {
          throw new Error('Failed to load book content')
        }

        const data = await response.json()
        setContent(data.content || '')
        
        // Restore reading position if available
        if (libraryItem.last_read_position) {
          setTimeout(() => {
            restoreReadingPosition(libraryItem.last_read_position!)
          }, 100)
        }
      } catch (error) {
        console.error('Error loading book content:', error)
        toast.error('Failed to load book content')
      } finally {
        setIsLoading(false)
      }
    }

    loadContent()
  }, [book.id, book.content_url, libraryItem.last_read_position])

  // Auto-save reading progress
  useEffect(() => {
    const saveProgress = async () => {
      if (!contentRef.current || currentProgress === libraryItem.progress) return

      const position = getCurrentReadingPosition()
      
      try {
        const response = await fetch('/api/library/progress', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            bookId: book.id,
            progress: currentProgress,
            lastReadPosition: position,
          }),
        })

        if (!response.ok) {
          throw new Error('Failed to save progress')
        }

        const result = await response.json()
        
        // Check if book was completed
        if (result.statusChanged && result.data?.status === 'completed') {
          toast.success('Congratulations! You completed the book!')
          onStatusUpdate?.('completed')
        }

        onProgressUpdate?.(currentProgress, position)
      } catch (error) {
        console.error('Error saving progress:', error)
      }
    }

    const debounceTimer = setTimeout(saveProgress, 2000)
    return () => clearTimeout(debounceTimer)
  }, [currentProgress, book.id, libraryItem.progress, onProgressUpdate, onStatusUpdate])

  // Calculate reading progress based on scroll position
  const calculateProgress = useCallback(() => {
    if (!contentRef.current) return

    const element = contentRef.current
    const scrollTop = element.scrollTop
    const scrollHeight = element.scrollHeight - element.clientHeight
    
    if (scrollHeight <= 0) return

    const progress = Math.min(100, Math.max(0, (scrollTop / scrollHeight) * 100))
    setCurrentProgress(Math.round(progress))
  }, [])

  // Handle scroll events for progress tracking
  useEffect(() => {
    const element = contentRef.current
    if (!element) return

    const handleScroll = () => {
      calculateProgress()
    }

    element.addEventListener('scroll', handleScroll, { passive: true })
    return () => element.removeEventListener('scroll', handleScroll)
  }, [calculateProgress])

  // Get current reading position for persistence
  const getCurrentReadingPosition = (): string => {
    if (!contentRef.current) return '0'
    
    const scrollTop = contentRef.current.scrollTop
    const scrollHeight = contentRef.current.scrollHeight
    
    return JSON.stringify({
      scrollTop,
      scrollHeight,
      timestamp: Date.now()
    })
  }

  // Restore reading position
  const restoreReadingPosition = (position: string) => {
    if (!contentRef.current) return

    try {
      const { scrollTop } = JSON.parse(position)
      contentRef.current.scrollTop = scrollTop
      calculateProgress()
    } catch (error) {
      console.error('Error restoring reading position:', error)
    }
  }

  // Update reader settings
  const updateSettings = async (newSettings: Partial<ReaderSettings>) => {
    const updatedSettings = { ...settings, ...newSettings }
    setSettings(updatedSettings)

    // Save to user preferences
    try {
      await fetch('/api/profile/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reading_preferences: updatedSettings
        }),
      })
    } catch (error) {
      console.error('Error saving reading preferences:', error)
    }
  }

  // Add bookmark
  const addBookmark = async () => {
    if (!contentRef.current) return

    const position = getCurrentReadingPosition()
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
  }

  // Navigate to bookmark
  const goToBookmark = (bookmark: Bookmark) => {
    restoreReadingPosition(bookmark.position)
    setShowBookmarks(false)
  }

  // Remove bookmark (for future use)
  // const removeBookmark = (bookmarkId: string) => {
  //   setBookmarks(prev => prev.filter(b => b.id !== bookmarkId))
  // }

  // Get theme classes
  const getThemeClasses = () => {
    const base = 'transition-colors duration-200'
    switch (settings.theme) {
      case 'dark':
        return `${base} bg-gray-900 text-gray-100`
      case 'sepia':
        return `${base} bg-amber-50 text-amber-900`
      default:
        return `${base} bg-white text-gray-900`
    }
  }

  // Get font size classes
  const getFontSizeClasses = () => {
    switch (settings.fontSize) {
      case 'small':
        return 'text-sm leading-relaxed'
      case 'large':
        return 'text-lg leading-relaxed'
      default:
        return 'text-base leading-relaxed'
    }
  }

  // Get font family classes
  const getFontFamilyClasses = () => {
    switch (settings.fontFamily) {
      case 'sans-serif':
        return 'font-sans'
      case 'monospace':
        return 'font-mono'
      default:
        return 'font-serif'
    }
  }

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
    <div className={`min-h-screen ${getThemeClasses()}`}>
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            
            <div className="hidden sm:block">
              <h1 className="font-semibold truncate max-w-[200px]">{book.title}</h1>
              <p className="text-sm text-muted-foreground">by {book.author}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Progress indicator */}
            <div className="hidden sm:flex items-center gap-2 min-w-[120px]">
              <Progress value={currentProgress} className="w-20" />
              <span className="text-sm text-muted-foreground">
                {Math.round(currentProgress)}%
              </span>
            </div>

            {/* Reader controls */}
            <Button
              variant="ghost"
              size="sm"
              onClick={addBookmark}
              title="Add bookmark"
            >
              <BookmarkPlus className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowBookmarks(!showBookmarks)}
              title="View bookmarks"
            >
              <Bookmark className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
              title="Reader settings"
            >
              <Settings className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsFullscreen(!isFullscreen)}
              title="Toggle fullscreen"
            >
              {isFullscreen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Mobile progress bar */}
        <div className="sm:hidden px-4 pb-2">
          <div className="flex items-center gap-2">
            <Progress value={currentProgress} className="flex-1" />
            <span className="text-sm text-muted-foreground">
              {Math.round(currentProgress)}%
            </span>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Settings Panel */}
        {showSettings && (
          <Card className="fixed top-14 right-4 z-40 w-80 max-h-[calc(100vh-5rem)] overflow-y-auto">
            <CardContent className="p-4">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Reading Settings</h3>
                </div>

                {/* Font Size */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Font Size</label>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateSettings({ fontSize: 'small' })}
                      className={settings.fontSize === 'small' ? 'bg-primary text-primary-foreground' : ''}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateSettings({ fontSize: 'medium' })}
                      className={settings.fontSize === 'medium' ? 'bg-primary text-primary-foreground' : ''}
                    >
                      <Type className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateSettings({ fontSize: 'large' })}
                      className={settings.fontSize === 'large' ? 'bg-primary text-primary-foreground' : ''}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Theme */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Theme</label>
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateSettings({ theme: 'light' })}
                      className={settings.theme === 'light' ? 'bg-primary text-primary-foreground' : ''}
                    >
                      <Sun className="h-4 w-4 mr-1" />
                      Light
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateSettings({ theme: 'dark' })}
                      className={settings.theme === 'dark' ? 'bg-primary text-primary-foreground' : ''}
                    >
                      <Moon className="h-4 w-4 mr-1" />
                      Dark
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateSettings({ theme: 'sepia' })}
                      className={settings.theme === 'sepia' ? 'bg-primary text-primary-foreground' : ''}
                    >
                      Sepia
                    </Button>
                  </div>
                </div>

                {/* Font Family */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Font Family</label>
                  <div className="space-y-2">
                    {[
                      { value: 'serif', label: 'Serif' },
                      { value: 'sans-serif', label: 'Sans Serif' },
                      { value: 'monospace', label: 'Monospace' }
                    ].map((font) => (
                      <Button
                        key={font.value}
                        variant="outline"
                        size="sm"
                        onClick={() => updateSettings({ fontFamily: font.value as any })}
                        className={`w-full justify-start ${
                          settings.fontFamily === font.value ? 'bg-primary text-primary-foreground' : ''
                        }`}
                      >
                        {font.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Bookmarks Panel */}
        {showBookmarks && (
          <Card className="fixed top-14 right-4 z-40 w-80 max-h-[calc(100vh-5rem)] overflow-y-auto">
            <CardContent className="p-4">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Bookmarks</h3>
                </div>

                {bookmarks.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No bookmarks yet</p>
                ) : (
                  <div className="space-y-2">
                    {bookmarks.map((bookmark) => (
                      <div
                        key={bookmark.id}
                        className="p-2 border rounded-lg cursor-pointer hover:bg-muted"
                        onClick={() => goToBookmark(bookmark)}
                      >
                        <p className="text-sm font-medium truncate">{bookmark.text}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(bookmark.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content */}
        <main className="flex-1">
          <div
            ref={contentRef}
            className={`
              max-w-4xl mx-auto px-4 py-8 h-[calc(100vh-3.5rem)] overflow-y-auto
              ${getFontSizeClasses()} ${getFontFamilyClasses()}
            `}
            style={{ scrollBehavior: 'smooth' }}
          >
            {content ? (
              <div 
                className="prose prose-lg max-w-none"
                dangerouslySetInnerHTML={{ __html: content }}
              />
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No content available for this book.</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}