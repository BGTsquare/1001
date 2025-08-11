'use client'

import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Upload, Image, FileText, CheckCircle, Loader2 } from 'lucide-react'

interface FileUploadState {
  file: File | null
  uploading: boolean
  progress: number
  url?: string
  error?: string
}

interface FileUploadSectionProps {
  type: 'cover' | 'content'
  fileState: FileUploadState
  tempId: string
  onFileSelect: (file: File) => void
  onUpload: () => void
  onReset: () => void
  error?: string
}

export function FileUploadSection({
  type,
  fileState,
  tempId,
  onFileSelect,
  onUpload,
  onReset,
  error
}: FileUploadSectionProps) {
  const isCover = type === 'cover'
  const Icon = isCover ? Image : FileText
  const acceptTypes = isCover ? 'image/*' : '.pdf,.epub,.txt,.docx'
  const label = isCover ? 'Cover Image *' : 'Content File *'
  const uploadId = `${type}-upload-${tempId}`

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4">
        {fileState.url ? (
          <div className="space-y-2">
            {isCover ? (
              <img 
                src={fileState.url} 
                alt="Cover preview" 
                className="w-full h-32 object-cover rounded"
              />
            ) : (
              <div className="flex items-center space-x-2 p-2 bg-muted rounded">
                <FileText className="w-6 h-6 text-primary" />
                <div>
                  <p className="text-xs font-medium">Content uploaded</p>
                  <p className="text-xs text-muted-foreground">
                    {fileState.file?.name || 'Book content'}
                  </p>
                </div>
                <CheckCircle className="w-4 h-4 text-green-500 ml-auto" />
              </div>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onReset}
            >
              Change
            </Button>
          </div>
        ) : (
          <div className="text-center">
            <Icon className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
            <div className="space-y-2">
              <input
                type="file"
                accept={acceptTypes}
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) onFileSelect(file)
                }}
                className="hidden"
                id={uploadId}
              />
              <label htmlFor={uploadId}>
                <Button type="button" variant="outline" size="sm" asChild>
                  <span>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload
                  </span>
                </Button>
              </label>
              {!isCover && (
                <p className="text-xs text-muted-foreground">
                  PDF, EPUB, TXT, DOCX
                </p>
              )}
              {fileState.file && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">{fileState.file.name}</p>
                  <Button
                    type="button"
                    size="sm"
                    onClick={onUpload}
                    disabled={fileState.uploading}
                  >
                    {fileState.uploading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      'Upload'
                    )}
                  </Button>
                  {fileState.uploading && (
                    <Progress value={fileState.progress} className="w-full" />
                  )}
                  {fileState.error && (
                    <p className="text-xs text-destructive">{fileState.error}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  )
}