'use client'

import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Image, Upload, Loader2 } from 'lucide-react'

interface BundleCoverState {
  file: File | null
  uploading: boolean
  progress: number
  url?: string
  error?: string
}

interface BundleInfoTabProps {
  bundleTitle: string
  setBundleTitle: (title: string) => void
  bundleDescription: string
  setBundleDescription: (description: string) => void
  bundlePrice: string
  setBundlePrice: (price: string) => void
  bundleCover: BundleCoverState
  setBundleCover: (cover: BundleCoverState) => void
  onBundleCoverSelect: (file: File) => void
  onUploadBundleCover: () => Promise<void>
  errors: Record<string, string>
}

export function BundleInfoTab({
  bundleTitle,
  setBundleTitle,
  bundleDescription,
  setBundleDescription,
  bundlePrice,
  setBundlePrice,
  bundleCover,
  setBundleCover,
  onBundleCoverSelect,
  onUploadBundleCover,
  errors
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
                    if (file) onBundleCoverSelect(file)
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
                      onClick={onUploadBundleCover}
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
    </div>
  )
}