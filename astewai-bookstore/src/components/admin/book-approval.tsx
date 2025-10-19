'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Eye, 
  MessageSquare,
  AlertTriangle,
  BookOpen,
  User,
  Calendar,
  DollarSign
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Book } from '@/types'

interface BookApprovalProps {
  className?: string
}

interface BookWithStatus extends Book {
  status: 'draft' | 'pending' | 'approved' | 'rejected'
  submitted_at?: string
  reviewed_at?: string
  reviewer_notes?: string
}

export function BookApproval({ className }: BookApprovalProps) {
  const [books, setBooks] = useState<BookWithStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedBook, setSelectedBook] = useState<BookWithStatus | null>(null)
  const [reviewNotes, setReviewNotes] = useState('')
  const [processingAction, setProcessingAction] = useState<string | null>(null)

  useEffect(() => {
    fetchPendingBooks()
  }, [])

  const fetchPendingBooks = async () => {
    try {
      setLoading(true)
      let response = await fetch('/api/admin/books/pending')
      
      // If main endpoint fails, try test endpoint
      if (!response.ok) {
        console.warn('Main endpoint failed, trying test endpoint')
        response = await fetch('/api/admin/books/pending/test')
      }
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      console.log('Fetched pending books:', data) // Debug log
      setBooks(data.books || [])
    } catch (error) {
      console.error('Error fetching pending books:', error)
      setBooks([]) // Set empty array on error
      // You might want to show a toast notification here
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (bookId: string) => {
    try {
      setProcessingAction(bookId)
      const response = await fetch(`/api/admin/books/${bookId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: reviewNotes })
      })

      if (!response.ok) {
        let errorMessage = 'Failed to approve book';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || JSON.stringify(errorData);
        } catch (jsonError) {
          try {
            const errorText = await response.text();
            errorMessage = `Server error: ${errorText.substring(0, 200)}...`;
          } catch (textError) { /* Ignore */ }
        }
        throw new Error(errorMessage);
      }

      toast.success('Book approved successfully!')
      setBooks(prev => prev.map(book => 
        book.id === bookId 
          ? { ...book, status: 'approved', reviewed_at: new Date().toISOString(), reviewer_notes: reviewNotes }
          : book
      ))

      setSelectedBook(null)
      setReviewNotes('')
    } catch (error: any) {
      console.error('Error approving book:', error)
      toast.error(error.message)
    } finally {
      setProcessingAction(null)
    }
  }

  const handleReject = async (bookId: string) => {
    if (!reviewNotes.trim()) {
      toast.error('Please provide rejection notes to help the author understand the issues.')
      return
    }

    try {
      setProcessingAction(bookId)
      const response = await fetch(`/api/admin/books/${bookId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: reviewNotes })
      })

      if (!response.ok) {
        let errorMessage = 'Failed to reject book';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || JSON.stringify(errorData);
        } catch (jsonError) {
          try {
            const errorText = await response.text();
            errorMessage = `Server error: ${errorText.substring(0, 200)}...`;
          } catch (textError) { /* Ignore */ }
        }
        throw new Error(errorMessage);
      }

      toast.success('Book rejected successfully.')
      setBooks(prev => prev.map(book => 
        book.id === bookId 
          ? { ...book, status: 'rejected', reviewed_at: new Date().toISOString(), reviewer_notes: reviewNotes }
          : book
      ))

      setSelectedBook(null)
      setReviewNotes('')
    } catch (error: any) {
      console.error('Error rejecting book:', error)
      toast.error(error.message)
    } finally {
      setProcessingAction(null)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Draft</Badge>
      case 'pending':
        return <Badge variant="outline"><AlertTriangle className="w-3 h-3 mr-1" />Pending Review</Badge>
      case 'approved':
        return <Badge variant="default"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const pendingBooks = books.filter(book => book.status === 'pending')
  const reviewedBooks = books.filter(book => ['approved', 'rejected'].includes(book.status))

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Book Approval</h2>
          <p className="text-muted-foreground">
            Review and approve books for publication
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{pendingBooks.length}</div>
            <div className="text-sm text-muted-foreground">Pending</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {reviewedBooks.filter(b => b.status === 'approved').length}
            </div>
            <div className="text-sm text-muted-foreground">Approved</div>
          </div>
        </div>
      </div>

      {/* Pending Reviews */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            <span>Pending Reviews ({pendingBooks.length})</span>
          </CardTitle>
          <CardDescription>
            Books waiting for approval to be published
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading pending books...</p>
              </div>
            </div>
          ) : pendingBooks.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 mx-auto text-green-500 mb-4" />
              <h3 className="text-lg font-medium mb-2">All caught up!</h3>
              <p className="text-muted-foreground">
                No books are currently pending review
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingBooks.map(book => (
                <div
                  key={book.id}
                  className="flex items-center space-x-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
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
                    <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span>Submitted {formatDate(book.submitted_at)}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <DollarSign className="w-4 h-4" />
                        <span>{book.is_free ? 'Free' : `$${book.price.toFixed(2)}`}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 mt-2">
                      {getStatusBadge(book.status)}
                      {book.category && (
                        <Badge variant="outline" className="text-xs">
                          {book.category}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedBook(book)
                            setReviewNotes('')
                          }}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Review
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Review Book: {book.title}</DialogTitle>
                          <DialogDescription>
                            Review the book details and decide whether to approve or reject
                          </DialogDescription>
                        </DialogHeader>
                        
                        {selectedBook && (
                          <div className="space-y-6">
                            {/* Book Details */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="space-y-4">
                                <div>
                                  <h3 className="font-medium mb-2">Book Information</h3>
                                  <div className="space-y-2 text-sm">
                                    <div><strong>Title:</strong> {selectedBook.title}</div>
                                    <div><strong>Author:</strong> {selectedBook.author}</div>
                                    <div><strong>Category:</strong> {selectedBook.category || 'Not specified'}</div>
                                    <div><strong>Price:</strong> {selectedBook.is_free ? 'Free' : `$${selectedBook.price.toFixed(2)}`}</div>
                                    <div><strong>Tags:</strong> {selectedBook.tags?.join(', ') || 'None'}</div>
                                  </div>
                                </div>

                                {selectedBook.description && (
                                  <div>
                                    <h3 className="font-medium mb-2">Description</h3>
                                    <p className="text-sm text-muted-foreground">
                                      {selectedBook.description}
                                    </p>
                                  </div>
                                )}
                              </div>

                              <div className="space-y-4">
                                {selectedBook.cover_image_url && (
                                  <div>
                                    <h3 className="font-medium mb-2">Cover Image</h3>
                                    <img 
                                      src={selectedBook.cover_image_url} 
                                      alt={selectedBook.title}
                                      className="w-full max-w-xs rounded border"
                                    />
                                  </div>
                                )}

                                <div>
                                  <h3 className="font-medium mb-2">Content File</h3>
                                  {selectedBook.content_url ? (
                                    <Button variant="outline" size="sm" asChild>
                                      <a href={selectedBook.content_url} target="_blank" rel="noopener noreferrer">
                                        <Eye className="w-4 h-4 mr-2" />
                                        Preview Content
                                      </a>
                                    </Button>
                                  ) : (
                                    <p className="text-sm text-muted-foreground">No content file available</p>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Review Notes */}
                            <div className="space-y-2">
                              <label className="text-sm font-medium">Review Notes</label>
                              <Textarea
                                value={reviewNotes}
                                onChange={(e) => setReviewNotes(e.target.value)}
                                placeholder="Add notes about your review decision (required for rejection)"
                                rows={4}
                              />
                            </div>

                            {/* Actions */}
                            <div className="flex items-center justify-end space-x-2 pt-4 border-t">
                              <Button
                                variant="destructive"
                                onClick={() => handleReject(selectedBook.id)}
                                disabled={processingAction === selectedBook.id}
                              >
                                <XCircle className="w-4 h-4 mr-2" />
                                Reject
                              </Button>
                              <Button
                                onClick={() => handleApprove(selectedBook.id)}
                                disabled={processingAction === selectedBook.id}
                              >
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Approve & Publish
                              </Button>
                            </div>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recently Reviewed */}
      {reviewedBooks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MessageSquare className="w-5 h-5" />
              <span>Recently Reviewed</span>
            </CardTitle>
            <CardDescription>
              Books that have been approved or rejected recently
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {reviewedBooks.slice(0, 5).map(book => (
                <div
                  key={book.id}
                  className="flex items-center space-x-4 p-4 border rounded-lg"
                >
                  <div className="w-12 h-16 bg-muted rounded overflow-hidden flex-shrink-0">
                    {book.cover_image_url ? (
                      <img 
                        src={book.cover_image_url} 
                        alt={book.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <BookOpen className="w-4 h-4 text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium truncate">{book.title}</h4>
                    <p className="text-sm text-muted-foreground truncate">by {book.author}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      {getStatusBadge(book.status)}
                      <span className="text-xs text-muted-foreground">
                        Reviewed {formatDate(book.reviewed_at)}
                      </span>
                    </div>
                  </div>

                  {book.reviewer_notes && (
                    <div className="max-w-xs">
                      <p className="text-xs text-muted-foreground truncate">
                        "{book.reviewer_notes}"
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}