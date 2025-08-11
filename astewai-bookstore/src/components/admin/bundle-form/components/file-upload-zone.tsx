'use client'

import { memo, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Upload, Loader2 } from 'lucide-react'

interface FileUploadZoneProps {
  label: string
  accept: string
  file: File | null
  uploading: boolean
  progress: number
  url?: string
  error?: string
  onFileSelect: (file: File) => void
  onUpload: () => void
  onReset: () => void
  icon: ReactNode
  uploadButtonText: string
  previewClassName?: string
}

export const FileUploadZone = memo(function FileUploadZone({
  label,
  accept,
  file,
  uploading,
  progress,
  url,
  error,
  onFileSelect,
  onUpload,
  onReset,
  icon,
  uploadButtonText,
  previewClassName = "w-full h-48 object-cover rounded"
}: FileUploadZoneProps) {
  const inputId = `file-upload-${Math.random().toString(36).substr(2, 9)}`

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      onFileSelect(selectedFile)
    }
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4">
        {url ? (
          <div className="space-y-2">
            {accept.startsWith('image/') ? (
              <img 
                src={url} 
                alt="Preview" 
                className={previewClassName}
              />
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground">File uploaded successfully</p>
              </div>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onReset}
            >
              Change File
            </Button>
          </div>
        ) : (
          <div className="text-center">
            {icon}
            <div className="space-y-2">
              <input
                type="file"
                accept={accept}
                onChange={handleFileChange}
                className="hidden"
                id={inputId}
              />
              <label htmlFor={inputId}>
                <Button type="button" variant="outline" size="sm" asChild>
                  <span>
                    <Upload className="w-4 h-4 mr-2" />
                    {uploadButtonText}
                  </span>
                </Button>
              </label>
              {file && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">{file.name}</p>
                  <Button
                    type="button"
                    size="sm"
                    onClick={onUpload}
                    disabled={uploading}
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      'Upload'
                    )}
                  </Button>
                  {uploading && (
                    <Progress value={progress} className="w-full" />
                  )}
                  {error && (
                    <p className="text-sm text-destructive">{error}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
})