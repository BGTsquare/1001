import { memo } from 'react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Upload, Image, Loader2 } from 'lucide-react'
import type { BundleFormData, ValidationErrors } from '../types'

interface BundleInfoTabProps {
  formData: BundleFormData
  errors: ValidationErrors
  onUpdateTitle: (title: string) => void
  onUpdateDescription: (description: string) => void
  onUpdatePrice: (price: string) => void
  onCoverSelect: (file: File) => void
  onCoverUpload: () => void
  onCoverRemove: () => void
}

export const BundleInfoTab = memo(function BundleInfoTab({
  formData,
  errors,
  onUpdateTitle,
  onUpdateDescription,
  onUpdatePrice,
  onCoverSelect,
  onCoverUpload,
  onCoverRemove
}: BundleInfoTabProps) {
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
            onChange={(e) => onUpdateTitle(e.target.value)}
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
            onChange={(e) => onUpdatePrice(e.target.value)}
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
          onChange={(e) => onUpdateDescription(e.target.value)}
          placeholder="Describe this bundle..."
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Bundle Cover Image (Optional)</label>
        <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4">
          {formData.cover.url ? (
            <div className="space-y-2">
              <img 
                src={formData.cover.url} 
                alt="Bundle cover preview" 
                className="w-full h-48 object-cover rounded"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onCoverRemove}
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
                    if (file) onCoverSelect(file)
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
                {formData.cover.file && (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">{formData.cover.file.name}</p>
                    <Button
                      type="button"
                      size="sm"
                      onClick={onCoverUpload}
                      disabled={formData.cover.uploading}
                    >
                      {formData.cover.uploading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        'Upload'
                      )}
                    </Button>
                    {formData.cover.uploading && (
                      <Progress value={formData.cover.progress} className="w-full" />
                    )}
                    {formData.cover.error && (
                      <p className="text-sm text-destructive">{formData.cover.error}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
})