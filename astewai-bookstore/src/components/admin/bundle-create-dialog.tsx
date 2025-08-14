'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent } from '@/components/ui/card'
import { CurrencyInput } from '@/components/ui/currency-input'
import { Search, BookOpen, AlertCircle } from 'lucide-react'
import { formatETB, parseETB } from '@/lib/utils/currency'
import type { Book } from '@/types'

interface BundleCreateDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
}

interface BookSearchResult {
    books: Book[]
    total: number
}

export function BundleCreateDialog({ open, onOpenChange, onSuccess }: BundleCreateDialogProps) {
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [price, setPrice] = useState('')
    const [selectedBooks, setSelectedBooks] = useState<Book[]>([])
    const [bookSearch, setBookSearch] = useState('')
    const [errors, setErrors] = useState<Record<string, string>>({})

    // Fetch available books
    const { data: bookData, isLoading: booksLoading } = useQuery<BookSearchResult>({
        queryKey: ['admin-books-for-bundle', bookSearch],
        queryFn: async () => {
            const params = new URLSearchParams({
                limit: '50',
                offset: '0'
            })

            if (bookSearch.trim()) {
                params.append('query', bookSearch.trim())
            }

            const response = await fetch(`/api/admin/books?${params}`)
            if (!response.ok) {
                throw new Error('Failed to fetch books')
            }
            return response.json()
        },
        enabled: open
    })

    const availableBooks = bookData?.books || []

    // Create bundle mutation
    const createMutation = useMutation({
        mutationFn: async (bundleData: {
            title: string
            description: string
            price: number
            bookIds: string[]
        }) => {
            const response = await fetch('/api/admin/bundles', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(bundleData),
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || 'Failed to create bundle')
            }

            return response.json()
        },
        onSuccess: () => {
            onSuccess()
            resetForm()
        },
        onError: (error: Error) => {
            setErrors({ general: error.message })
        }
    })

    const resetForm = () => {
        setTitle('')
        setDescription('')
        setPrice('')
        setSelectedBooks([])
        setBookSearch('')
        setErrors({})
    }

    const handleBookToggle = (book: Book) => {
        setSelectedBooks(prev => {
            const isSelected = prev.some(b => b.id === book.id)
            if (isSelected) {
                return prev.filter(b => b.id !== book.id)
            } else {
                return [...prev, book]
            }
        })
    }

    const calculateTotalBookPrice = () => {
        return selectedBooks.reduce((sum, book) => sum + book.price, 0)
    }

    const calculateSavings = () => {
        const totalBookPrice = calculateTotalBookPrice()
        const bundlePrice = parseFloat(price) || 0
        return totalBookPrice - bundlePrice
    }

    const calculateDiscountPercentage = () => {
        const totalBookPrice = calculateTotalBookPrice()
        const savings = calculateSavings()
        return totalBookPrice > 0 ? (savings / totalBookPrice) * 100 : 0
    }

    const validateForm = () => {
        const newErrors: Record<string, string> = {}

        if (!title.trim()) {
            newErrors.title = 'Bundle title is required'
        }

        if (!price || parseFloat(price) <= 0) {
            newErrors.price = 'Valid price is required'
        }

        if (selectedBooks.length === 0) {
            newErrors.books = 'At least one book must be selected'
        }

        const bundlePrice = parseFloat(price) || 0
        const totalBookPrice = calculateTotalBookPrice()

        if (bundlePrice > totalBookPrice) {
            newErrors.price = 'Bundle price cannot exceed total book prices'
        }

        if (bundlePrice >= totalBookPrice * 0.99) {
            newErrors.price = 'Bundle must provide at least 1% discount'
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()

        if (!validateForm()) {
            return
        }

        createMutation.mutate({
            title: title.trim(),
            description: description.trim(),
            price: parseFloat(price),
            bookIds: selectedBooks.map(book => book.id)
        })
    }

    const handleClose = () => {
        if (!createMutation.isPending) {
            resetForm()
            onOpenChange(false)
        }
    }

    useEffect(() => {
        if (!open) {
            resetForm()
        }
    }, [open])

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Create New Bundle</DialogTitle>
                    <DialogDescription>
                        Create a curated bundle of books with discounted pricing
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Bundle Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label htmlFor="title" className="text-sm font-medium">
                                Bundle Title *
                            </label>
                            <Input
                                id="title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Enter bundle title"
                                className={errors.title ? 'border-red-500' : ''}
                            />
                            {errors.title && (
                                <p className="text-sm text-red-600">{errors.title}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="price" className="text-sm font-medium">
                                Bundle Price (ETB) *
                            </label>
                            <CurrencyInput
                                id="price"
                                value={price}
                                onChange={setPrice}
                                error={!!errors.price}
                            />
                            {errors.price && (
                                <p className="text-sm text-red-600">{errors.price}</p>
                            )}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="description" className="text-sm font-medium">
                            Description
                        </label>
                        <Textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Describe this bundle..."
                            rows={3}
                        />
                    </div>

                    {/* Pricing Summary */}
                    {selectedBooks.length > 0 && (
                        <Card>
                            <CardContent className="pt-4">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                    <div>
                                        <div className="font-medium">Total Book Price</div>
                                        <div className="text-lg">{Math.round(calculateTotalBookPrice())} ETB</div>
                                    </div>
                                    <div>
                                        <div className="font-medium">Bundle Price</div>
                                        <div className="text-lg">{Math.round(parseFloat(price) || 0)} ETB</div>
                                    </div>
                                    <div>
                                        <div className="font-medium">Customer Savings</div>
                                        <div className="text-lg text-green-600">
                                            {Math.round(calculateSavings())} ETB ({calculateDiscountPercentage().toFixed(1)}% off)
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Book Selection */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-medium">Select Books</h3>
                            <Badge variant="secondary">
                                {selectedBooks.length} selected
                            </Badge>
                        </div>

                        {errors.books && (
                            <div className="flex items-center space-x-2 text-red-600">
                                <AlertCircle className="w-4 h-4" />
                                <p className="text-sm">{errors.books}</p>
                            </div>
                        )}

                        {/* Book Search */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                            <Input
                                placeholder="Search books to add to bundle..."
                                value={bookSearch}
                                onChange={(e) => setBookSearch(e.target.value)}
                                className="pl-10"
                            />
                        </div>

                        {/* Selected Books */}
                        {selectedBooks.length > 0 && (
                            <div className="space-y-2">
                                <h4 className="font-medium">Selected Books</h4>
                                <div className="space-y-2 max-h-32 overflow-y-auto">
                                    {selectedBooks.map((book) => (
                                        <div key={book.id} className="flex items-center justify-between p-2 bg-muted rounded">
                                            <div className="flex-1">
                                                <div className="font-medium">{book.title}</div>
                                                <div className="text-sm text-muted-foreground">by {book.author}</div>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <span className="text-sm font-medium">{Math.round(book.price)} ETB</span>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleBookToggle(book)}
                                                >
                                                    Remove
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Available Books */}
                        <div className="space-y-2">
                            <h4 className="font-medium">Available Books</h4>
                            {booksLoading ? (
                                <div className="text-center py-4">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                                </div>
                            ) : (
                                <div className="space-y-2 max-h-64 overflow-y-auto">
                                    {availableBooks
                                        .filter(book => !selectedBooks.some(selected => selected.id === book.id))
                                        .map((book) => (
                                            <div key={book.id} className="flex items-center justify-between p-2 border rounded hover:bg-muted/50">
                                                <div className="flex items-center space-x-3">
                                                    <Checkbox
                                                        checked={false}
                                                        onCheckedChange={() => handleBookToggle(book)}
                                                    />
                                                    <div className="flex-1">
                                                        <div className="font-medium">{book.title}</div>
                                                        <div className="text-sm text-muted-foreground">by {book.author}</div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <span className="text-sm font-medium">{Math.round(book.price)} ETB</span>
                                                    <BookOpen className="w-4 h-4 text-muted-foreground" />
                                                </div>
                                            </div>
                                        ))}

                                    {availableBooks.filter(book => !selectedBooks.some(selected => selected.id === book.id)).length === 0 && (
                                        <div className="text-center py-4 text-muted-foreground">
                                            {bookSearch ? 'No books found matching your search' : 'All books are already selected'}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {errors.general && (
                        <div className="flex items-center space-x-2 text-red-600">
                            <AlertCircle className="w-4 h-4" />
                            <p className="text-sm">{errors.general}</p>
                        </div>
                    )}

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleClose}
                            disabled={createMutation.isPending}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={createMutation.isPending}
                        >
                            {createMutation.isPending ? 'Creating...' : 'Create Bundle'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}