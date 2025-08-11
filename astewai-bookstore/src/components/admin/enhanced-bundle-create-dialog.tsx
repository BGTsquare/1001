'use client'

import { useState, useEffect } from 'react'
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
    Upload, 
    Plus, 
    BookOpen, 
    Image, 
    AlertCircle,
    Loader2
} from 'lucide-react'
import { BookEditor } from './book-editor'
import { useBundleCreation } from '@/hooks/use-bundle-creation'
import { useFileUpload } from '@/hooks/use-file-upload'
import type { FileType, UploadOptions } from '@/types/bundle-creation'
import { Badge } from '../ui/badge'
import { X } from 'lucide-react'
import { 
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { BookInsert } from './bundle-create/types'
import { useMutation } from '@tanstack/react-query'

interface EnhancedBundleCreateDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
}

interface FileUploadState {
    file: File | null
    uploading: boolean
    progress: number
    url?: string
    error?: string
}

interface NewBookData extends BookInsert {
    tempId: string
    coverImage: FileUploadState
    contentFile: FileUploadState
}

interface BundleCoverState {
    file: File | null
    uploading: boolean
    progress: number
    url?: string
    error?: string
}

export function EnhancedBundleCreateDialog({ open, onOpenChange, onSuccess }: EnhancedBundleCreateDialogProps) {
    const [bundleTitle, setBundleTitle] = useState('')
    const [bundleDescription, setBundleDescription] = useState('')
    const [bundlePrice, setBundlePrice] = useState('')
    const [bundleCover, setBundleCover] = useState<BundleCoverState>({
        file: null,
        uploading: false,
        progress: 0
    })
    
    const [newBooks, setNewBooks] = useState<NewBookData[]>([])
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [activeTab, setActiveTab] = useState('bundle-info')

    const categories = [
        'Fiction', 'Non-Fiction', 'Science Fiction', 'Fantasy', 'Mystery', 
        'Romance', 'Thriller', 'Biography', 'History', 'Science', 'Technology', 
        'Business', 'Self-Help', 'Health', 'Travel', 'Cooking', 'Art', 'Music', 
        'Sports', 'Education'
    ]

    // Create bundle with new books mutation
    const createMutation = useMutation({
        mutationFn: async (bundleData: {
            title: string
            description: string
            price: number
            cover_image_url?: string
            books: Omit<BookInsert, 'id'>[]
        }) => {
            const response = await fetch('/api/admin/bundles/create-with-books', {
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
        setBundleTitle('')
        setBundleDescription('')
        setBundlePrice('')
        setBundleCover({ file: null, uploading: false, progress: 0 })
        setNewBooks([])
        setErrors({})
        setActiveTab('bundle-info')
    }

    const addNewBook = () => {
        const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        const newBook: NewBookData = {
            tempId,
            title: '',
            author: '',
            description: '',
            category: '',
            price: 0,
            is_free: true,
            tags: [],
            cover_image_url: '',
            content_url: '',
            coverImage: { file: null, uploading: false, progress: 0 },
            contentFile: { file: null, uploading: false, progress: 0 }
        }
        setNewBooks(prev => [...prev, newBook])
    }

    const removeBook = (tempId: string) => {
        setNewBooks(prev => prev.filter(book => book.tempId !== tempId))
    }

    const updateBook = (tempId: string, updates: Partial<NewBookData>) => {
        setNewBooks(prev => prev.map(book => 
            book.tempId === tempId ? { ...book, ...updates } : book
        ))
    }

    const handleFileSelect = (tempId: string, type: 'cover' | 'content', file: File) => {
        updateBook(tempId, {
            [type === 'cover' ? 'coverImage' : 'contentFile']: {
                file,
                uploading: false,
                progress: 0,
                error: undefined
            }
        })
    }

    const handleBundleCoverSelect = (file: File) => {
        setBundleCover({
            file,
            uploading: false,
            progress: 0,
            error: undefined
        })
    }

    const uploadFile = async (tempId: string, type: 'cover' | 'content') => {
        const book = newBooks.find(b => b.tempId === tempId)
        if (!book) return

        const fileState = type === 'cover' ? book.coverImage : book.contentFile
        if (!fileState.file) return

        updateBook(tempId, {
            [type === 'cover' ? 'coverImage' : 'contentFile']: {
                ...fileState,
                uploading: true,
                progress: 0
            }
        })

        try {
            const formData = new FormData()
            formData.append('file', fileState.file)
            formData.append('type', type)
            formData.append('optimize', 'true')
            formData.append('generateThumbnail', type === 'cover' ? 'true' : 'false')

            const response = await fetch('/api/admin/books/upload-simple', {
                method: 'POST',
                body: formData
            })

            if (!response.ok) {
                throw new Error(`Upload failed: ${response.status}`)
            }

            const result = await response.json()
            
            updateBook(tempId, {
                [type === 'cover' ? 'coverImage' : 'contentFile']: {
                    ...fileState,
                    uploading: false,
                    progress: 100,
                    url: result.url,
                    error: undefined
                },
                [type === 'cover' ? 'cover_image_url' : 'content_url']: result.url
            })

        } catch (error) {
            console.error('Upload error:', error)
            updateBook(tempId, {
                [type === 'cover' ? 'coverImage' : 'contentFile']: {
                    ...fileState,
                    uploading: false,
                    progress: 0,
                    error: 'Upload failed. Please try again.'
                }
            })
        }
    }

    const uploadBundleCover = async () => {
        if (!bundleCover.file) return

        setBundleCover(prev => ({ ...prev, uploading: true, progress: 0 }))

        try {
            const formData = new FormData()
            formData.append('file', bundleCover.file)
            formData.append('type', 'cover')
            formData.append('optimize', 'true')
            formData.append('generateThumbnail', 'true')

            const response = await fetch('/api/admin/books/upload-simple', {
                method: 'POST',
                body: formData
            })

            if (!response.ok) {
                throw new Error(`Upload failed: ${response.status}`)
            }

            const result = await response.json()
            
            setBundleCover(prev => ({
                ...prev,
                uploading: false,
                progress: 100,
                url: result.url,
                error: undefined
            }))

        } catch (error) {
            console.error('Bundle cover upload error:', error)
            setBundleCover(prev => ({
                ...prev,
                uploading: false,
                progress: 0,
                error: 'Upload failed. Please try again.'
            }))
        }
    }

    const addTag = (tempId: string, tag: string) => {
        const book = newBooks.find(b => b.tempId === tempId)
        if (book && tag.trim() && !book.tags?.includes(tag.trim())) {
            updateBook(tempId, {
                tags: [...(book.tags || []), tag.trim()]
            })
        }
    }

    const removeTag = (tempId: string, tagToRemove: string) => {
        const book = newBooks.find(b => b.tempId === tempId)
        if (book) {
            updateBook(tempId, {
                tags: book.tags?.filter(tag => tag !== tagToRemove) || []
            })
        }
    }

    const calculateTotalBookPrice = () => {
        return newBooks.reduce((sum, book) => sum + (book.price || 0), 0)
    }

    const calculateSavings = () => {
        const totalBookPrice = calculateTotalBookPrice()
        const bundlePriceNum = parseFloat(bundlePrice) || 0
        return totalBookPrice - bundlePriceNum
    }

    const calculateDiscountPercentage = () => {
        const totalBookPrice = calculateTotalBookPrice()
        const savings = calculateSavings()
        return totalBookPrice > 0 ? (savings / totalBookPrice) * 100 : 0
    }

    const validateForm = () => {
        const newErrors: Record<string, string> = {}

        if (!bundleTitle.trim()) {
            newErrors.bundleTitle = 'Bundle title is required'
        }

        if (!bundlePrice || parseFloat(bundlePrice) <= 0) {
            newErrors.bundlePrice = 'Valid bundle price is required'
        }

        if (newBooks.length === 0) {
            newErrors.books = 'At least one book must be added to the bundle'
        }

        // Validate each book
        newBooks.forEach((book, index) => {
            if (!book.title?.trim()) {
                newErrors[`book-${index}-title`] = `Book ${index + 1} title is required`
            }
            if (!book.author?.trim()) {
                newErrors[`book-${index}-author`] = `Book ${index + 1} author is required`
            }
            if (!book.cover_image_url && !book.coverImage.url) {
                newErrors[`book-${index}-cover`] = `Book ${index + 1} cover image is required`
            }
            if (!book.content_url && !book.contentFile.url) {
                newErrors[`book-${index}-content`] = `Book ${index + 1} content file is required`
            }
        })

        const bundlePriceNum = parseFloat(bundlePrice) || 0
        const totalBookPrice = calculateTotalBookPrice()

        if (bundlePriceNum > totalBookPrice) {
            newErrors.bundlePrice = 'Bundle price cannot exceed total book prices'
        }

        // Validate minimum discount requirement
        if (totalBookPrice > 0 && bundlePriceNum > totalBookPrice * 0.99) {
            newErrors.bundlePrice = 'Bundle must provide at least a 1% discount'
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!validateForm()) {
            return
        }

        // Upload bundle cover if selected
        if (bundleCover.file && !bundleCover.url && !bundleCover.uploading) {
            await uploadBundleCover()
        }

        // Auto-upload any pending book files
        for (const book of newBooks) {
            if (book.coverImage.file && !book.coverImage.url && !book.coverImage.uploading) {
                await uploadFile(book.tempId, 'cover')
            }
            if (book.contentFile.file && !book.contentFile.url && !book.contentFile.uploading) {
                await uploadFile(book.tempId, 'content')
            }
        }

        // Wait for state updates
        await new Promise(resolve => setTimeout(resolve, 100))

        // Prepare books data (exclude temp fields)
        const booksData = newBooks.map(book => ({
            title: book.title,
            author: book.author,
            description: book.description,
            category: book.category,
            price: book.price,
            is_free: book.is_free,
            tags: book.tags,
            cover_image_url: book.cover_image_url,
            content_url: book.content_url
        }))

        createMutation.mutate({
            title: bundleTitle.trim(),
            description: bundleDescription.trim(),
            price: parseFloat(bundlePrice),
            cover_image_url: bundleCover.url,
            books: booksData
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
            <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Create New Bundle with Books</DialogTitle>
                    <DialogDescription>
                        Create a curated bundle by uploading new books directly with custom cover
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="bundle-info">Bundle Info</TabsTrigger>
                            <TabsTrigger value="books">Books ({newBooks.length})</TabsTrigger>
                            <TabsTrigger value="pricing">Pricing</TabsTrigger>
                        </TabsList>

                        <TabsContent value="bundle-info" className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label htmlFor="bundleTitle" className="text-sm font-medium">
                                        Bundle Title *
                                    </label>
                                    <Input
                                        id="bundleTitle"
                                        value={bundleTitle}
                                        onChange={(e) => setBundleTitle(e.target.value)}
                                        placeholder="Enter bundle title"
                                        className={errors.bundleTitle ? 'border-red-500' : ''}
                                    />
                                    {errors.bundleTitle && (
                                        <p className="text-sm text-red-600">{errors.bundleTitle}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="bundlePrice" className="text-sm font-medium">
                                        Bundle Price *
                                    </label>
                                    <Input
                                        id="bundlePrice"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={bundlePrice}
                                        onChange={(e) => setBundlePrice(e.target.value)}
                                        placeholder="0.00"
                                        className={errors.bundlePrice ? 'border-red-500' : ''}
                                    />
                                    {errors.bundlePrice && (
                                        <p className="text-sm text-red-600">{errors.bundlePrice}</p>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="bundleDescription" className="text-sm font-medium">
                                    Description
                                </label>
                                <Textarea
                                    id="bundleDescription"
                                    value={bundleDescription}
                                    onChange={(e) => setBundleDescription(e.target.value)}
                                    placeholder="Describe this bundle..."
                                    rows={3}
                                />
                            </div>

                            {/* Bundle Cover Upload */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Bundle Cover Image (Optional)</label>
                                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4">
                                    {bundleCover.url ? (
                                        <div className="space-y-2">
                                            <img 
                                                src={bundleCover.url} 
                                                alt="Bundle cover preview" 
                                                className="w-full h-48 object-cover rounded"
                                            />
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setBundleCover({ file: null, uploading: false, progress: 0 })}
                                            >
                                                Change Cover
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="text-center">
                                            <Image className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
                                            <div className="space-y-2">
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={(e) => {
                                                        const file = e.target.files?.[0]
                                                        if (file) handleBundleCoverSelect(file)
                                                    }}
                                                    className="hidden"
                                                    id="bundle-cover-upload"
                                                />
                                                <label htmlFor="bundle-cover-upload">
                                                    <Button type="button" variant="outline" size="sm" asChild>
                                                        <span>
                                                            <Upload className="w-4 h-4 mr-2" />
                                                            Upload Bundle Cover
                                                        </span>
                                                    </Button>
                                                </label>
                                                {bundleCover.file && (
                                                    <div className="space-y-2">
                                                        <p className="text-sm text-muted-foreground">{bundleCover.file.name}</p>
                                                        <Button
                                                            type="button"
                                                            size="sm"
                                                            onClick={uploadBundleCover}
                                                            disabled={bundleCover.uploading}
                                                        >
                                                            {bundleCover.uploading ? (
                                                                <>
                                                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                                    Uploading...
                                                                </>
                                                            ) : (
                                                                'Upload'
                                                            )}
                                                        </Button>
                                                        {bundleCover.uploading && (
                                                            <Progress value={bundleCover.progress} className="w-full" />
                                                        )}
                                                        {bundleCover.error && (
                                                            <p className="text-sm text-destructive">{bundleCover.error}</p>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="books" className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-medium">Bundle Books</h3>
                                <Button type="button" onClick={addNewBook} size="sm">
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add Book
                                </Button>
                            </div>

                            {errors.books && (
                                <div className="flex items-center space-x-2 text-red-600">
                                    <AlertCircle className="w-4 h-4" />
                                    <p className="text-sm">{errors.books}</p>
                                </div>
                            )}

                            <div className="space-y-6">
                                {newBooks.map((book, index) => (
                                    <BookEditor
                                        key={book.tempId}
                                        book={book}
                                        index={index}
                                        categories={categories}
                                        errors={errors}
                                        onUpdate={(updates) => updateBook(book.tempId, updates)}
                                        onRemove={() => removeBook(book.tempId)}
                                        onFileSelect={(type, file) => handleFileSelect(book.tempId, type, file)}
                                        onUploadFile={(type) => uploadFile(book.tempId, type)}
                                        onAddTag={(tag) => addTag(book.tempId, tag)}
                                        onRemoveTag={(tag) => removeTag(book.tempId, tag)}
                                    />
                                ))}

                                {newBooks.length === 0 && (
                                    <div className="text-center py-8 text-muted-foreground">
                                        <BookOpen className="w-12 h-12 mx-auto mb-2" />
                                        <p>No books added yet. Click "Add Book" to get started.</p>
                                    </div>
                                )}
                            </div>
                        </TabsContent>

                        <TabsContent value="pricing" className="space-y-4">
                            {newBooks.length > 0 && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Pricing Summary</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                            <div>
                                                <div className="font-medium">Total Book Price</div>
                                                <div className="text-lg">${calculateTotalBookPrice().toFixed(2)}</div>
                                            </div>
                                            <div>
                                                <div className="font-medium">Bundle Price</div>
                                                <div className="text-lg">${(parseFloat(bundlePrice) || 0).toFixed(2)}</div>
                                            </div>
                                            <div>
                                                <div className="font-medium">Customer Savings</div>
                                                <div className="text-lg text-green-600">
                                                    ${calculateSavings().toFixed(2)} ({calculateDiscountPercentage().toFixed(1)}% off)
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            <div className="space-y-2">
                                <h3 className="text-lg font-medium">Books in Bundle</h3>
                                {newBooks.map((book, index) => (
                                    <div key={book.tempId} className="flex items-center justify-between p-3 border rounded">
                                        <div>
                                            <div className="font-medium">{book.title || `Book ${index + 1}`}</div>
                                            <div className="text-sm text-muted-foreground">by {book.author || 'Unknown Author'}</div>
                                        </div>
                                        <div className="text-sm font-medium">${(book.price || 0).toFixed(2)}</div>
                                    </div>
                                ))}
                            </div>
                        </TabsContent>
                    </Tabs>

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
                            {createMutation.isPending ? 'Creating Bundle...' : 'Create Bundle'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

// Book Editor Component
interface BookEditorProps {
    book: NewBookData
    index: number
    categories: string[]
    errors: Record<string, string>
    onUpdate: (updates: Partial<NewBookData>) => void
    onRemove: () => void
    onFileSelect: (type: 'cover' | 'content', file: File) => void
    onUploadFile: (type: 'cover' | 'content') => void
    onAddTag: (tag: string) => void
    onRemoveTag: (tag: string) => void
}

function BookEditor({ 
    book, 
    index, 
    categories, 
    errors, 
    onUpdate, 
    onRemove, 
    onFileSelect, 
    onUploadFile,
    onAddTag,
    onRemoveTag
}: BookEditorProps) {
    const [newTag, setNewTag] = useState('')

    const handleAddTag = () => {
        if (newTag.trim()) {
            onAddTag(newTag.trim())
            setNewTag('')
        }
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Book {index + 1}</CardTitle>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={onRemove}
                        className="text-red-600 hover:text-red-700"
                    >
                        <Trash2 className="w-4 h-4" />
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Title *</label>
                        <Input
                            value={book.title}
                            onChange={(e) => onUpdate({ title: e.target.value })}
                            placeholder="Enter book title"
                            className={cn(errors[`book-${index}-title`] && 'border-destructive')}
                        />
                        {errors[`book-${index}-title`] && (
                            <p className="text-sm text-destructive">{errors[`book-${index}-title`]}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Author *</label>
                        <Input
                            value={book.author}
                            onChange={(e) => onUpdate({ author: e.target.value })}
                            placeholder="Enter author name"
                            className={cn(errors[`book-${index}-author`] && 'border-destructive')}
                        />
                        {errors[`book-${index}-author`] && (
                            <p className="text-sm text-destructive">{errors[`book-${index}-author`]}</p>
                        )}
                    </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                    <label className="text-sm font-medium">Description</label>
                    <Textarea
                        value={book.description || ''}
                        onChange={(e) => onUpdate({ description: e.target.value })}
                        placeholder="Enter book description"
                        rows={3}
                    />
                </div>

                {/* Category and Pricing */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Category</label>
                        <Select 
                            value={book.category || undefined} 
                            onValueChange={(value) => onUpdate({ category: value === 'none' ? null : value })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">No category</SelectItem>
                                {categories.map(category => (
                                    <SelectItem key={category} value={category}>
                                        {category}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Price</label>
                        <div className="flex items-center space-x-2">
                            <Input
                                type="number"
                                min="0"
                                step="0.01"
                                value={book.price}
                                onChange={(e) => {
                                    const price = parseFloat(e.target.value) || 0
                                    onUpdate({ 
                                        price,
                                        is_free: price === 0
                                    })
                                }}
                                placeholder="0.00"
                                disabled={book.is_free}
                            />
                            <Button
                                type="button"
                                variant={book.is_free ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => onUpdate({ 
                                    is_free: !book.is_free,
                                    price: !book.is_free ? 0 : book.price
                                })}
                            >
                                {book.is_free ? 'Free' : 'Paid'}
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Tags */}
                <div className="space-y-2">
                    <label className="text-sm font-medium">Tags</label>
                    <div className="flex items-center space-x-2">
                        <Input
                            value={newTag}
                            onChange={(e) => setNewTag(e.target.value)}
                            placeholder="Add a tag"
                            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                        />
                        <Button type="button" onClick={handleAddTag} size="sm">
                            <Plus className="w-4 h-4" />
                        </Button>
                    </div>
                    {book.tags && book.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                            {book.tags.map(tag => (
                                <Badge key={tag} variant="secondary" className="flex items-center space-x-1">
                                    <span>{tag}</span>
                                    <button
                                        type="button"
                                        onClick={() => onRemoveTag(tag)}
                                        className="ml-1 hover:text-destructive"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </Badge>
                            ))}
                        </div>
                    )}
                </div>

                {/* File Uploads */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Cover Image Upload */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Cover Image *</label>
                        <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4">
                            {book.coverImage.url ? (
                                <div className="space-y-2">
                                    <img 
                                        src={book.coverImage.url} 
                                        alt="Cover preview" 
                                        className="w-full h-32 object-cover rounded"
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => onUpdate({ 
                                            coverImage: { file: null, uploading: false, progress: 0 },
                                            cover_image_url: ''
                                        })}
                                    >
                                        Change
                                    </Button>
                                </div>
                            ) : (
                                <div className="text-center">
                                    <Image className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                                    <div className="space-y-2">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0]
                                                if (file) onFileSelect('cover', file)
                                            }}
                                            className="hidden"
                                            id={`cover-upload-${book.tempId}`}
                                        />
                                        <label htmlFor={`cover-upload-${book.tempId}`}>
                                            <Button type="button" variant="outline" size="sm" asChild>
                                                <span>
                                                    <Upload className="w-4 h-4 mr-2" />
                                                    Upload
                                                </span>
                                            </Button>
                                        </label>
                                        {book.coverImage.file && (
                                            <div className="space-y-2">
                                                <p className="text-xs text-muted-foreground">{book.coverImage.file.name}</p>
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    onClick={() => onUploadFile('cover')}
                                                    disabled={book.coverImage.uploading}
                                                >
                                                    {book.coverImage.uploading ? (
                                                        <>
                                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                            Uploading...
                                                        </>
                                                    ) : (
                                                        'Upload'
                                                    )}
                                                </Button>
                                                {book.coverImage.uploading && (
                                                    <Progress value={book.coverImage.progress} className="w-full" />
                                                )}
                                                {book.coverImage.error && (
                                                    <p className="text-xs text-destructive">{book.coverImage.error}</p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                        {errors[`book-${index}-cover`] && (
                            <p className="text-sm text-destructive">{errors[`book-${index}-cover`]}</p>
                        )}
                    </div>

                    {/* Content File Upload */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Content File *</label>
                        <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4">
                            {book.contentFile.url ? (
                                <div className="space-y-2">
                                    <div className="flex items-center space-x-2 p-2 bg-muted rounded">
                                        <FileText className="w-6 h-6 text-primary" />
                                        <div>
                                            <p className="text-xs font-medium">Content uploaded</p>
                                            <p className="text-xs text-muted-foreground">
                                                {book.contentFile.file?.name || 'Book content'}
                                            </p>
                                        </div>
                                        <CheckCircle className="w-4 h-4 text-green-500 ml-auto" />
                                    </div>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => onUpdate({ 
                                            contentFile: { file: null, uploading: false, progress: 0 },
                                            content_url: ''
                                        })}
                                    >
                                        Change
                                    </Button>
                                </div>
                            ) : (
                                <div className="text-center">
                                    <FileText className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                                    <div className="space-y-2">
                                        <input
                                            type="file"
                                            accept=".pdf,.epub,.txt,.docx"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0]
                                                if (file) onFileSelect('content', file)
                                            }}
                                            className="hidden"
                                            id={`content-upload-${book.tempId}`}
                                        />
                                        <label htmlFor={`content-upload-${book.tempId}`}>
                                            <Button type="button" variant="outline" size="sm" asChild>
                                                <span>
                                                    <Upload className="w-4 h-4 mr-2" />
                                                    Upload
                                                </span>
                                            </Button>
                                        </label>
                                        <p className="text-xs text-muted-foreground">
                                            PDF, EPUB, TXT, DOCX
                                        </p>
                                        {/* FIX: Reconstructed this block to correctly handle file info display */}
                                        {book.contentFile.file && (
                                            <div className="space-y-2">
                                                <p className="text-xs text-muted-foreground">{book.contentFile.file.name}</p>
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    onClick={() => onUploadFile('content')}
                                                    disabled={book.contentFile.uploading}
                                                >
                                                    {book.contentFile.uploading ? (
                                                        <>
                                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                            Uploading...
                                                        </>
                                                    ) : (
                                                        'Upload'
                                                    )}
                                                </Button>
                                                {book.contentFile.uploading && (
                                                    <Progress value={book.contentFile.progress} className="w-full" />
                                                )}
                                                {book.contentFile.error && (
                                                    <p className="text-xs text-destructive">{book.contentFile.error}</p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                        {errors[`book-${index}-content`] && (
                            <p className="text-sm text-destructive">{errors[`book-${index}-content`]}</p>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}