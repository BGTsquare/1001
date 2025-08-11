'use client'

import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Upload, Image, Loader2 } from 'lucide-react'

interface BundleCoverState {
  file: File | null
  uploading: boolean
  progress: number
  url?: string
  error?: string
}

interface BundleCoverUploadProps {
  bundleCover: BundleCoverState
  onFileSelect: (file: File) => void
  onUpload: () => void
  onReset: () => void
}

export function BundleCoverUpload({ 
  bundleCover, 
  onFileSelect, 
  onUpload, 
  onReset 
}: BundleCoverUploadProps) {
  return (
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
              onClick={onReset}
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
                  if (file) onFileSelect(file)
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
                    onClick={onUpload}
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
  )
}