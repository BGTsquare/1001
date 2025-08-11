'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { 
    Upload, 
    X, 
    Plus, 
    Image, 
    FileText,
    CheckCircle,
    Loader2,
    Trash2
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Database } from '@/types/database'

type BookInsert = Database['public']['Tables']['books']['Insert']

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

export function BookEditor({ 
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