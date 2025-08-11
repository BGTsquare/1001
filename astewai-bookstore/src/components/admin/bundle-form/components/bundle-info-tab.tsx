'use client'

import { memo } from 'react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Upload, Image, Loader2 } from 'lucide-react'
import type { BundleFormData, ValidationErrors } from '../types'
import { FileUploadZone } from './file-upload-zone'

interface BundleInfoTabProps {
  formData: BundleFormData
  errors: ValidationErrors
  onUpdateFormData: (updates: Partial<BundleFormData>) => void
  onUploadBundleCover: () => Promise<void>
}

export const BundleInfoTab = memo(function BundleInfoTab({
  formData,
  errors,
  onUpdateFormData,
  onUploadBundleCover
}: BundleInfoTabProps) {
  const handleTitleChange = (value: string) => {
    onUpdateFormData({ title: value })
  }

  const handleDescriptionChange = (value: string) => {
    onUpdateFormData({ description: value })
  }

  const handlePriceChange = (value: string) => {
    onUpdateFormData({ price: value })
  }

  const handleCoverSelect = (file: File) => {
    onUpdateFormData({
      cover: {
        file,
        uploading: false,
        progress: 0,
        error: undefined
      }
    })
  }

  const handleCoverReset = () => {
    onUpdateFormData({
      cover: { file: null, uploading: false, progress: 0 }
    })
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label htmlFor="bundleTitle" className="text-sm font-medium">
            Bundle Title *
          </label>
          <Input
            id="bundleTitle"
            value={formData.title}
            onChange={(e) => handleTitleChange(e.target.value)}
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
            value={formData.price}
            onChange={(e) => handlePriceChange(e.target.value)}
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
          value={formData.description}
          onChange={(e) => handleDescriptionChange(e.target.value)}
          placeholder="Describe this bundle..."
          rows={3}
        />
      </div>

      <FileUploadZone
        label="Bundle Cover Image (Optional)"
        accept="image/*"
        file={formData.cover.file}
        uploading={formData.cover.uploading}
        progress={formData.cover.progress}
        url={formData.cover.url}
        error={formData.cover.error}
        onFileSelect={handleCoverSelect}
        onUpload={onUploadBundleCover}
        onReset={handleCoverReset}
        icon={<Image className="w-12 h-12 mx-auto text-muted-foreground mb-2" />}
        uploadButtonText="Upload Bundle Cover"
      />
    </div>
  )
})