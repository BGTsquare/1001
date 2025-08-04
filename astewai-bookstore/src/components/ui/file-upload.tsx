'use client'

import { useState, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { 
  Upload, 
  X, 
  File, 
  Image, 
  CheckCircle, 
  AlertCircle, 
  Loader2 
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { validateFile } from '@/lib/storage/file-validation'
import { FileType } from '@/lib/storage/types'

interface FileUploadProps {
  onFileSelect?: (files: File[]) => void
  onUploadComplete?: (results: any[]) => void
  onUploadProgress?: (progress: { file: File; percentage: number }[]) => void
  accept?: string
  multiple?: boolean
  maxFiles?: number
  maxSize?: number
  fileType?: FileType
  disabled?: boolean
  className?: string
  children?: React.ReactNode
}

interface FileUploadState {
  file: File
  progress: number
  status: 'pending' | 'uploading' | 'completed' | 'error'
  error?: string
  result?: any
}

export function FileUpload({
  onFileSelect,
  onUploadComplete,
  onUploadProgress,
  accept,
  multiple = false,
  maxFiles = 10,
  maxSize,
  fileType = 'other',
  disabled = false,
  className,
  children
}: FileUploadProps) {
  const [files, setFiles] = useState<FileUploadState[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = useCallback((selectedFiles: FileList | null) => {
    if (!selectedFiles) return

    const newFiles: FileUploadState[] = []
    const validFiles: File[] = []

    Array.from(selectedFiles).forEach(file => {
      // Check file count limit
      if (files.length + newFiles.length >= maxFiles) {
        return
      }

      // Validate file
      const validation = validateFile(file, fileType, { maxSize })
      
      if (validation.isValid) {
        newFiles.push({
          file,
          progress: 0,
          status: 'pending'
        })
        validFiles.push(file)
      } else {
        newFiles.push({
          file,
          progress: 0,
          status: 'error',
          error: validation.errors.join(', ')
        })
      }
    })

    setFiles(prev => [...prev, ...newFiles])
    
    if (validFiles.length > 0) {
      onFileSelect?.(validFiles)
    }
  }, [files.length, maxFiles, maxSize, fileType, onFileSelect])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    if (!disabled) {
      setIsDragOver(true)
    }
  }, [disabled])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    if (!disabled) {
      handleFileSelect(e.dataTransfer.files)
    }
  }, [disabled, handleFileSelect])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files)
    // Reset input value to allow selecting the same file again
    e.target.value = ''
  }, [handleFileSelect])

  const removeFile = useCallback((index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }, [])

  const clearAll = useCallback(() => {
    setFiles([])
  }, [])

  const updateFileProgress = useCallback((index: number, progress: number, status?: FileUploadState['status']) => {
    setFiles(prev => prev.map((file, i) => 
      i === index 
        ? { ...file, progress, status: status || file.status }
        : file
    ))
  }, [])

  const updateFileResult = useCallback((index: number, result: any, error?: string) => {
    setFiles(prev => prev.map((file, i) => 
      i === index 
        ? { 
            ...file, 
            status: error ? 'error' : 'completed',
            result,
            error 
          }
        : file
    ))
  }, [])

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <Image className="w-5 h-5" />
    }
    return <File className="w-5 h-5" />
  }

  const getStatusIcon = (status: FileUploadState['status']) => {
    switch (status) {
      case 'uploading':
        return <Loader2 className="w-4 h-4 animate-spin" />
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />
      default:
        return null
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Drop Zone */}
      <div
        className={cn(
          'border-2 border-dashed rounded-lg p-6 text-center transition-colors',
          isDragOver && !disabled && 'border-primary bg-primary/5',
          disabled && 'opacity-50 cursor-not-allowed',
          !disabled && 'cursor-pointer hover:border-primary/50'
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleInputChange}
          disabled={disabled}
          className="hidden"
        />
        
        {children || (
          <>
            <Upload className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
            <div className="space-y-2">
              <p className="text-sm font-medium">
                {isDragOver ? 'Drop files here' : 'Click to upload or drag and drop'}
              </p>
              <p className="text-xs text-muted-foreground">
                {accept ? `Accepted formats: ${accept}` : 'All file types accepted'}
                {maxSize && ` • Max size: ${formatFileSize(maxSize)}`}
              </p>
            </div>
          </>
        )}
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">
              Files ({files.length})
            </h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAll}
              className="text-xs"
            >
              Clear All
            </Button>
          </div>
          
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {files.map((fileState, index) => (
              <div
                key={`${fileState.file.name}-${index}`}
                className="flex items-center space-x-3 p-3 border rounded-lg"
              >
                <div className="flex-shrink-0">
                  {getFileIcon(fileState.file)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium truncate">
                      {fileState.file.name}
                    </p>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(fileState.status)}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                        className="h-6 w-6 p-0"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{formatFileSize(fileState.file.size)}</span>
                    {fileState.status === 'uploading' && (
                      <span>{fileState.progress}%</span>
                    )}
                  </div>
                  
                  {fileState.status === 'uploading' && (
                    <Progress value={fileState.progress} className="h-1 mt-2" />
                  )}
                  
                  {fileState.status === 'error' && fileState.error && (
                    <p className="text-xs text-red-500 mt-1">{fileState.error}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Export the update functions for external use
export type FileUploadRef = {
  updateProgress: (index: number, progress: number, status?: FileUploadState['status']) => void
  updateResult: (index: number, result: any, error?: string) => void
  clearFiles: () => void
}