'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { 
  BookOpen, 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye,
  MoreHorizontal,
  Upload,
  Download,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle
} from 'lucide-react'
import { BookUpload } from './book-upload'
import { getAdminBooks } from '@/lib/repositories/admin-book-repository'
import { LoadingSkeletons } from '@/components/ui/loading-skeletons'
import { cn } from '@/lib/utils'
import type { Book } from '@/types'

interface BookManagerProps {
  className?: string
}

interface BookFilters {
  search: string
  category: string
  status: 'all' | 'published' | 'draft'
  priceType: 'all' | 'free' | 'paid'
}

interface BulkAction {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  action: (selectedBooks: string[]) => void
  variant?: 'default' | 'destructive'
}

export function BookManager({ className }: BookManagerProps) {
  const [selectedBooks, setSelectedBooks] = useState<string[]>([])
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [editingBook, setEditingBook] = useState<Book | null>(null)
  const [filters, setFilters] = useState<BookFilters>({
    search: '',
    category: '',
    status: 'all',
    priceType: 'all'
  })

  const { data: books = [], isLoading: loading, error, refetch } = useQuery({
    queryKey: ['admin-books', filters],
    queryFn: () => getAdminBooks({
      query: filters.search || undefined,
      category: filters.category || undefined,
      isFree: filters.priceType === 'all' ? undefined : filters.priceType === 'free',
      limit: 50,
      offset: 0,
      sortBy: 'created_at',
      sortOrder: 'desc'
    }),
  })

  const categories = [
    'Fiction', 'Non-Fiction', 'Science Fiction', 'Fantasy', 'Mystery', 
    'Romance', 'Thriller', 'Biography', 'History', 'Science', 'Technology',
    'Business', 'Self-Help', 'Health', 'Travel', 'Cooking', 'Art', 'Music',
    'Sports', 'Education'
  ]

  const bulkActions: BulkAction[] = [
    {
      id: 'publish',
      label: 'Publish Selected',
      icon: CheckCircle,
      action: handleBulkPublish
    },
    {
      id: 'unpublish',
      label: 'Unpublish Selected',
      icon: XCircle,
      action: handleBulkUnpublish
    },
    {
      id: 'delete',
      label: 'Delete Selected',
      icon: Trash2,
      action: handleBulkDelete,
      variant: 'destructive'
    },
    {
      id: 'export',
      label: 'Export Selected',
      icon: Download,
      action: handleBulkExport
    }
  ]

  const handleBookCreated = (book: Book) => {
    refetch() // Refetch books after creation
    setShowUploadDialog(false)
  }

  const handleBookUpdated = (updatedBook: Book) => {
    refetch() // Refetch books after update
    setEditingBook(null)
  }

  const handleDeleteBook = async (bookId: string) => {
    if (!confirm('Are you sure you want to delete this book? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/books/${bookId}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Failed to delete book')

      refetch() // Refetch books after deletion
      setSelectedBooks(prev => prev.filter(id => id !== bookId))
    } catch (error) {
      console.error('Error deleting book:', error)
      alert('Failed to delete book. Please try again.')
    }
  }

  const toggleBookSelection = (bookId: string) => {
    setSelectedBooks(prev => 
      prev.includes(bookId) 
        ? prev.filter(id => id !== bookId)
        : [...prev, bookId]
    )
  }

  const toggleSelectAll = () => {
    setSelectedBooks(prev => 
      prev.length === books.length ? [] : books.map(book => book.id)
    )
  }

  async function handleBulkPublish(bookIds: string[]) {
    try {
      const response = await fetch('/api/admin/books/bulk', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          bookIds, 
          action: 'publish' 
        })
      })

      if (!response.ok) throw new Error('Failed to publish books')

      // Refresh books list
      refetch()
      setSelectedBooks([])
    } catch (error) {
      console.error('Error publishing books:', error)
      alert('Failed to publish selected books. Please try again.')
    }
  }

  async function handleBulkUnpublish(bookIds: string[]) {
    try {
      const response = await fetch('/api/admin/books/bulk', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          bookIds, 
          action: 'unpublish' 
        })
      })

      if (!response.ok) throw new Error('Failed to unpublish books')

      refetch()
      setSelectedBooks([])
    } catch (error) {
      console.error('Error unpublishing books:', error)
      alert('Failed to unpublish selected books. Please try again.')
    }
  }

  async function handleBulkDelete(bookIds: string[]) {
    if (!confirm(`Are you sure you want to delete ${bookIds.length} books? This action cannot be undone.`)) {
      return
    }

    try {
      const response = await fetch('/api/admin/books/bulk', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookIds })
      })

      if (!response.ok) throw new Error('Failed to delete books')

      refetch()
      setSelectedBooks([])
    } catch (error) {
      console.error('Error deleting books:', error)
      alert('Failed to delete selected books. Please try again.')
    }
  }

  async function handleBulkExport(bookIds: string[]) {
    try {
      const response = await fetch('/api/admin/books/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookIds })
      })

      if (!response.ok) throw new Error('Failed to export books')

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `books-export-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error exporting books:', error)
      alert('Failed to export selected books. Please try again.')
    }
  }

  const filteredBooks = books.filter(book => {
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      if (!book.title.toLowerCase().includes(searchLower) && 
          !book.author.toLowerCase().includes(searchLower)) {
        return false
      }
    }
    return true
  })

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <LoadingSkeletons.Text className="h-8 w-48" />
          <LoadingSkeletons.Button />
        </div>
        <div className="grid gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <LoadingSkeletons.Card key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-semibold mb-2">Failed to load books</h3>
        <p className="text-muted-foreground mb-4">Please try again later.</p>
        <Button onClick={() => refetch()}>Retry</Button>
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Book Management</h2>
          <p className="text-muted-foreground">
            Manage your book catalog, upload new books, and handle approvals
          </p>
        </div>
        <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Book
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Upload New Book</DialogTitle>
              <DialogDescription>
                Add a new book to your catalog with cover image and content
              </DialogDescription>
            </DialogHeader>
            <BookUpload 
              onSuccess={handleBookCreated}
              onCancel={() => setShowUploadDialog(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="w-4 h-4" />
            <span>Filters</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search books..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <Select 
                value={filters.category || undefined} 
                onValueChange={(value) => setFilters(prev => ({ ...prev, category: value === 'all' ? '' : value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Price Type</label>
              <Select 
                value={filters.priceType || 'all'} 
                onValueChange={(value: any) => setFilters(prev => ({ ...prev, priceType: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All books</SelectItem>
                  <SelectItem value="free">Free books</SelectItem>
                  <SelectItem value="paid">Paid books</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select 
                value={filters.status || 'all'} 
                onValueChange={(value: any) => setFilters(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All status</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedBooks.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {selectedBooks.length} book{selectedBooks.length !== 1 ? 's' : ''} selected
              </p>
              <div className="flex items-center space-x-2">
                {bulkActions.map(action => {
                  const Icon = action.icon
                  return (
                    <Button
                      key={action.id}
                      variant={action.variant || 'outline'}
                      size="sm"
                      onClick={() => action.action(selectedBooks)}
                    >
                      <Icon className="w-4 h-4 mr-2" />
                      {action.label}
                    </Button>
                  )
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Books List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Books ({filteredBooks.length})</CardTitle>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={toggleSelectAll}
              >
                {selectedBooks.length === books.length ? 'Deselect All' : 'Select All'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading books...</p>
              </div>
            </div>
          ) : filteredBooks.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No books found</h3>
              <p className="text-muted-foreground mb-4">
                {filters.search || filters.category 
                  ? 'Try adjusting your filters or search terms'
                  : 'Get started by uploading your first book'
                }
              </p>
              {!filters.search && !filters.category && (
                <Button onClick={() => setShowUploadDialog(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Book
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredBooks.map(book => (
                <div
                  key={book.id}
                  className={cn(
                    'flex items-center space-x-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors',
                    selectedBooks.includes(book.id) && 'bg-muted/50 border-primary'
                  )}
                >
                  <input
                    type="checkbox"
                    checked={selectedBooks.includes(book.id)}
                    onChange={() => toggleBookSelection(book.id)}
                    className="rounded"
                  />
                  
                  <div className="w-16 h-20 bg-muted rounded overflow-hidden flex-shrink-0">
                    {book.cover_image_url ? (
                      <img 
                        src={book.cover_image_url} 
                        alt={book.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <BookOpen className="w-6 h-6 text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate">{book.title}</h3>
                    <p className="text-sm text-muted-foreground truncate">by {book.author}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      {book.category && (
                        <Badge variant="secondary" className="text-xs">
                          {book.category}
                        </Badge>
                      )}
                      <Badge variant={book.is_free ? 'outline' : 'default'} className="text-xs">
                        {book.is_free ? 'Free' : `$${book.price.toFixed(2)}`}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingBook(book)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteBook(book.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Book Dialog */}
      {editingBook && (
        <Dialog open={!!editingBook} onOpenChange={() => setEditingBook(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Book</DialogTitle>
              <DialogDescription>
                Update book information and content
              </DialogDescription>
            </DialogHeader>
            <BookUpload 
              mode="edit"
              initialData={editingBook}
              onSuccess={handleBookUpdated}
              onCancel={() => setEditingBook(null)}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}