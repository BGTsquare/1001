'use client'

import { useEffect, useCallback } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AlertCircle } from 'lucide-react'

import { useBundleForm } from './hooks/use-bundle-form'
import { useFileUpload } from './hooks/use-file-upload'
import { useBookManagement } from './hooks/use-book-management'
import { validateBundleForm } from './utils/validation'
import { BundleInfoTab } from './components/bundle-info-tab'
import { BooksTab } from './components/books-tab'
import { PricingTab } from './components/pricing-tab'
import { BOOK_CATEGORIES, UI_CONFIG } from './constants'

interface EnhancedBundleCreateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function EnhancedBundleCreateDialog({ 
  open, 
  onOpenChange, 
  onSuccess 
}: EnhancedBundleCreateDialogProps) {
  const {
    formData,
    errors,
    activeTab,
    setActiveTab,
    setErrors,
    updateFormData,
    addBook,
    removeBook,
    updateBook,
    resetForm,
    createMutation
  } = useBundleForm(onSuccess)

  const { createFileUploadHandler } = useFileUpload()
  const { handleFileSelect, addTag, removeTag, uploadBookFile } = useBookManagement(
    formData.books,
    updateBook
  )

  // Bundle form handlers
  const handleTitleChange = useCallback((title: string) => {
    updateFormData({ title })
  }, [updateFormData])

  const handleDescriptionChange = useCallback((description: string) => {
    updateFormData({ description })
  }, [updateFormData])

  const handlePriceChange = useCallback((price: string) => {
    updateFormData({ price })
  }, [updateFormData])

  const handleBundleCoverSelect = useCallback((file: File) => {
    updateFormData({
      cover: { file, uploading: false, progress: 0, error: undefined }
    })
  }, [updateFormData])

  const handleBundleCoverUpload = useCallback(async () => {
    if (!formData.cover.file) return

    const uploadHandler = createFileUploadHandler((updates) => {
      updateFormData({ cover: { ...formData.cover, ...updates } })
    })

    try {
      await uploadHandler(formData.cover.file, 'cover')
    } catch (error) {
      console.error('Bundle cover upload failed:', error)
    }
  }, [formData.cover, createFileUploadHandler, updateFormData])

  const handleBundleCoverRemove = useCallback(() => {
    updateFormData({
      cover: { file: null, uploading: false, progress: 0 }
    })
  }, [updateFormData])

  // Form submission
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()

    const validationErrors = validateBundleForm(formData)
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    // Auto-upload pending files
    if (formData.cover.file && !formData.cover.url && !formData.cover.uploading) {
      await handleBundleCoverUpload()
    }

    // Upload book files
    for (const book of formData.books) {
      if (book.coverImage.file && !book.coverImage.url && !book.coverImage.uploading) {
        await uploadBookFile(book.tempId, 'cover', createFileUploadHandler(() => {}))
      }
      if (book.contentFile.file && !book.contentFile.url && !book.contentFile.uploading) {
        await uploadBookFile(book.tempId, 'content', createFileUploadHandler(() => {}))
      }
    }

    // Wait for state updates
    await new Promise(resolve => setTimeout(resolve, UI_CONFIG.UPLOAD_PROGRESS_DELAY))

    // Prepare submission data
    const booksData = formData.books.map(book => ({
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
      title: formData.title.trim(),
      description: formData.description.trim(),
      price: parseFloat(formData.price),
      cover_image_url: formData.cover.url,
      books: booksData
    })
  }, [formData, setErrors, handleBundleCoverUpload, uploadBookFile, createFileUploadHandler, createMutation])

  const handleClose = useCallback(() => {
    if (!createMutation.isPending) {
      resetForm()
      onOpenChange(false)
    }
  }, [createMutation.isPending, resetForm, onOpenChange])

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      resetForm()
    }
  }, [open, resetForm])

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
              <TabsTrigger value={UI_CONFIG.TABS.BUNDLE_INFO}>Bundle Info</TabsTrigger>
              <TabsTrigger value={UI_CONFIG.TABS.BOOKS}>Books ({formData.books.length})</TabsTrigger>
              <TabsTrigger value={UI_CONFIG.TABS.PRICING}>Pricing</TabsTrigger>
            </TabsList>

            <TabsContent value={UI_CONFIG.TABS.BUNDLE_INFO}>
              <BundleInfoTab
                formData={formData}
                errors={errors}
                onUpdateTitle={handleTitleChange}
                onUpdateDescription={handleDescriptionChange}
                onUpdatePrice={handlePriceChange}
                onCoverSelect={handleBundleCoverSelect}
                onCoverUpload={handleBundleCoverUpload}
                onCoverRemove={handleBundleCoverRemove}
              />
            </TabsContent>

            <TabsContent value={UI_CONFIG.TABS.BOOKS}>
              <BooksTab
                books={formData.books}
                categories={BOOK_CATEGORIES}
                errors={errors}
                onAddBook={addBook}
                onRemoveBook={removeBook}
                onUpdateBook={updateBook}
                onFileSelect={handleFileSelect}
                onUploadFile={uploadBookFile}
                onAddTag={addTag}
                onRemoveTag={removeTag}
              />
            </TabsContent>

            <TabsContent value={UI_CONFIG.TABS.PRICING}>
              <PricingTab formData={formData} />
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