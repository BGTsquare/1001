'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Upload, 
  X, 
  Plus, 
  BookOpen, 
  Image, 
  FileText,
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Database } from '@/types/database'

type BookInsert = Database['public']['Tables']['books']['Insert']

interface BookUploadProps {
  onSuccess?: (book: any) => void
  onCancel?: () => void
  initialData?: Partial<BookInsert>
  mode?: 'create' | 'edit'
}

interface FileUploadState {
  file: File | null
  uploading: boolean
  progress: number
  url?: string
  error?: string
}

export function BookUpload({ 
  onSuccess, 
  onCancel, 
  initialData,
  mode = 'create' 
}: BookUploadProps) {
  const router = useRouter()
  const [formData, setFormData] = useState<BookInsert>({
    title: initialData?.title || '',
    author: initialData?.author || '',
    description: initialData?.description || '',
    category: initialData?.category || '',
    price: initialData?.price || 0,
    is_free: initialData?.is_free ?? true,
    tags: initialData?.tags || [],
    cover_image_url: initialData?.cover_image_url || '',
    content_url: initialData?.content_url || ''
  })

  const [coverImage, setCoverImage] = useState<FileUploadState>({
    file: null,
    uploading: false,
    progress: 0,
    url: initialData?.cover_image_url
  })

  const [contentFile, setContentFile] = useState<FileUploadState>({
    file: null,
    uploading: false,
    progress: 0,
    url: initialData?.content_url
  })

  const [newTag, setNewTag] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const categories = [
    'Fiction',
    'Non-Fiction',
    'Science Fiction',
    'Fantasy',
    'Mystery',
    'Romance',
    'Thriller',
    'Biography',
    'History',
    'Science',
    'Technology',
    'Business',
    'Self-Help',
    'Health',
    'Travel',
    'Cooking',
    'Art',
    'Music',
    'Sports',
    'Education'
  ]

  const handleInputChange = (field: keyof BookInsert, value: any) => {
    // Handle special case for category "none" value
    if (field === 'category' && value === 'none') {
      value = null
    }
    
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handlePriceChange = (value: string) => {
    const price = parseFloat(value) || 0
    setFormData(prev => ({ 
      ...prev, 
      price,
      is_free: price === 0
    }))
  }

  const handleFreeToggle = (isFree: boolean) => {
    setFormData(prev => ({ 
      ...prev, 
      is_free: isFree,
      price: isFree ? 0 : prev.price
    }))
  }

  const addTag = () => {
    if (newTag.trim() && !formData.tags?.includes(newTag.trim())) {
      const updatedTags = [...(formData.tags || []), newTag.trim()]
      setFormData(prev => ({ ...prev, tags: updatedTags }))
      setNewTag('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    const updatedTags = formData.tags?.filter(tag => tag !== tagToRemove) || []
    setFormData(prev => ({ ...prev, tags: updatedTags }))
  }

  const handleFileSelect = (type: 'cover' | 'content', file: File) => {
    const setState = type === 'cover' ? setCoverImage : setContentFile
    
    setState({
      file,
      uploading: false,
      progress: 0,
      error: undefined
    })
  }

  const uploadFile = async (type: 'cover' | 'content') => {
    const fileState = type === 'cover' ? coverImage : contentFile
    const setState = type === 'cover' ? setCoverImage : setContentFile
    
    if (!fileState.file) return

    setState(prev => ({ ...prev, uploading: true, progress: 0 }))

    try {
      const formData = new FormData()
      formData.append('file', fileState.file)
      formData.append('type', type)
      formData.append('optimize', 'true') // Enable optimization
      formData.append('generateThumbnail', type === 'cover' ? 'true' : 'false')

      const response = await fetch('/api/admin/books/upload', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error('Upload failed')
      }

      const result = await response.json()
      
      setState(prev => ({ 
        ...prev, 
        uploading: false, 
        progress: 100, 
        url: result.url,
        error: undefined
      }))

      // Update form data with the uploaded file URL
      if (type === 'cover') {
        setFormData(prev => ({ ...prev, cover_image_url: result.url }))
      } else {
        setFormData(prev => ({ ...prev, content_url: result.url }))
      }

      // Show optimization info if available
      if (result.optimized) {
        console.log(`File optimized: ${result.originalSize} -> ${result.size} bytes`)
      }

    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        uploading: false, 
        progress: 0,
        error: 'Upload failed. Please try again.'
      }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.title?.trim()) {
      newErrors.title = 'Title is required'
    }

    if (!formData.author?.trim()) {
      newErrors.author = 'Author is required'
    }

    if (!formData.is_free && (!formData.price || formData.price <= 0)) {
      newErrors.price = 'Paid books must have a price greater than 0'
    }

    if (!formData.cover_image_url) {
      newErrors.cover_image_url = 'Cover image is required'
    }

    if (!formData.content_url) {
      newErrors.content_url = 'Book content file is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setIsSubmitting(true)

    try {
      const endpoint = mode === 'edit' && initialData?.id 
        ? `/api/admin/books/${initialData.id}`
        : '/api/admin/books'
      
      const method = mode === 'edit' ? 'PUT' : 'POST'

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save book')
      }

      const book = await response.json()
      onSuccess?.(book)
      
      if (mode === 'create') {
        // Reset form for new book
        setFormData({
          title: '',
          author: '',
          description: '',
          category: '',
          price: 0,
          is_free: true,
          tags: [],
          cover_image_url: '',
          content_url: ''
        })
        setCoverImage({ file: null, uploading: false, progress: 0 })
        setContentFile({ file: null, uploading: false, progress: 0 })
      }

    } catch (error) {
      console.error('Error saving book:', error)
      setErrors({ submit: error instanceof Error ? error.message : 'Failed to save book' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <BookOpen className="w-5 h-5" />
          <span>{mode === 'edit' ? 'Edit Book' : 'Upload New Book'}</span>
        </CardTitle>
        <CardDescription>
          {mode === 'edit' 
            ? 'Update book information and content'
            : 'Add a new book to your catalog with cover image and content file'
          }
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Title *</label>
              <Input
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Enter book title"
                className={cn(errors.title && 'border-destructive')}
              />
              {errors.title && (
                <p className="text-sm text-destructive flex items-center space-x-1">
                  <AlertCircle className="w-4 h-4" />
                  <span>{errors.title}</span>
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Author *</label>
              <Input
                value={formData.author}
                onChange={(e) => handleInputChange('author', e.target.value)}
                placeholder="Enter author name"
                className={cn(errors.author && 'border-destructive')}
              />
              {errors.author && (
                <p className="text-sm text-destructive flex items-center space-x-1">
                  <AlertCircle className="w-4 h-4" />
                  <span>{errors.author}</span>
                </p>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <Textarea
              value={formData.description || ''}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Enter book description"
              rows={4}
            />
          </div>

          {/* Category and Pricing */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <Select 
                value={formData.category || undefined} 
                onValueChange={(value) => handleInputChange('category', value)}
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
                  value={formData.price}
                  onChange={(e) => handlePriceChange(e.target.value)}
                  placeholder="0.00"
                  disabled={formData.is_free}
                  className={cn(errors.price && 'border-destructive')}
                />
                <Button
                  type="button"
                  variant={formData.is_free ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleFreeToggle(!formData.is_free)}
                >
                  {formData.is_free ? 'Free' : 'Paid'}
                </Button>
              </div>
              {errors.price && (
                <p className="text-sm text-destructive flex items-center space-x-1">
                  <AlertCircle className="w-4 h-4" />
                  <span>{errors.price}</span>
                </p>
              )}
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
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              />
              <Button type="button" onClick={addTag} size="sm">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {formData.tags && formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="flex items-center space-x-1">
                    <span>{tag}</span>
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
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
                {coverImage.url ? (
                  <div className="space-y-2">
                    <img 
                      src={coverImage.url} 
                      alt="Cover preview" 
                      className="w-full h-48 object-cover rounded"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setCoverImage({ file: null, uploading: false, progress: 0 })}
                    >
                      Change Image
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
                          if (file) handleFileSelect('cover', file)
                        }}
                        className="hidden"
                        id="cover-upload"
                      />
                      <label htmlFor="cover-upload">
                        <Button type="button" variant="outline" size="sm" asChild>
                          <span>
                            <Upload className="w-4 h-4 mr-2" />
                            Upload Cover
                          </span>
                        </Button>
                      </label>
                      {coverImage.file && (
                        <div className="space-y-2">
                          <p className="text-sm text-muted-foreground">{coverImage.file.name}</p>
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => uploadFile('cover')}
                            disabled={coverImage.uploading}
                          >
                            {coverImage.uploading ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Uploading...
                              </>
                            ) : (
                              'Upload'
                            )}
                          </Button>
                          {coverImage.uploading && (
                            <Progress value={coverImage.progress} className="w-full" />
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              {errors.cover_image_url && (
                <p className="text-sm text-destructive flex items-center space-x-1">
                  <AlertCircle className="w-4 h-4" />
                  <span>{errors.cover_image_url}</span>
                </p>
              )}
            </div>

            {/* Content File Upload */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Book Content *</label>
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4">
                {contentFile.url ? (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 p-2 bg-muted rounded">
                      <FileText className="w-8 h-8 text-primary" />
                      <div>
                        <p className="text-sm font-medium">Content uploaded</p>
                        <p className="text-xs text-muted-foreground">
                          {contentFile.file?.name || 'Book content file'}
                        </p>
                      </div>
                      <CheckCircle className="w-5 h-5 text-green-500 ml-auto" />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setContentFile({ file: null, uploading: false, progress: 0 })}
                    >
                      Change File
                    </Button>
                  </div>
                ) : (
                  <div className="text-center">
                    <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
                    <div className="space-y-2">
                      <input
                        type="file"
                        accept=".pdf,.epub,.txt,.docx"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) handleFileSelect('content', file)
                        }}
                        className="hidden"
                        id="content-upload"
                      />
                      <label htmlFor="content-upload">
                        <Button type="button" variant="outline" size="sm" asChild>
                          <span>
                            <Upload className="w-4 h-4 mr-2" />
                            Upload Content
                          </span>
                        </Button>
                      </label>
                      <p className="text-xs text-muted-foreground">
                        PDF, EPUB, TXT, or DOCX files
                      </p>
                      {contentFile.file && (
                        <div className="space-y-2">
                          <p className="text-sm text-muted-foreground">{contentFile.file.name}</p>
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => uploadFile('content')}
                            disabled={contentFile.uploading}
                          >
                            {contentFile.uploading ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Uploading...
                              </>
                            ) : (
                              'Upload'
                            )}
                          </Button>
                          {contentFile.uploading && (
                            <Progress value={contentFile.progress} className="w-full" />
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              {errors.content_url && (
                <p className="text-sm text-destructive flex items-center space-x-1">
                  <AlertCircle className="w-4 h-4" />
                  <span>{errors.content_url}</span>
                </p>
              )}
            </div>
          </div>

          {/* Submit Error */}
          {errors.submit && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
              <p className="text-sm text-destructive flex items-center space-x-1">
                <AlertCircle className="w-4 h-4" />
                <span>{errors.submit}</span>
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end space-x-2 pt-4 border-t">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {mode === 'edit' ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                <>
                  {mode === 'edit' ? 'Update Book' : 'Create Book'}
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}