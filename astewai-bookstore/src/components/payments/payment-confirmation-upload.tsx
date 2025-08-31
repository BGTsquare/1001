'use client'

import { useState, useCallback, useRef } from 'react'
import { Upload, X, FileText, Image, AlertCircle, CheckCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from 'sonner'

interface PaymentConfirmationFile {
  id: string
  file: File
  preview?: string
  status: 'pending' | 'uploading' | 'uploaded' | 'error'
  progress: number
  error?: string
  uploadedUrl?: string
}

interface PaymentConfirmationUploadProps {
  purchaseRequestId: string
  transactionReference: string
  onUploadComplete: (files: PaymentConfirmationFile[]) => void
  onUploadStart?: () => void
  maxFiles?: number
  disabled?: boolean
}

const ACCEPTED_FILE_TYPES = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
  'application/pdf': ['.pdf']
}

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const MAX_FILES = 3

export function PaymentConfirmationUpload({
  purchaseRequestId,
  transactionReference,
  onUploadComplete,
  onUploadStart,
  maxFiles = MAX_FILES,
  disabled = false
}: PaymentConfirmationUploadProps) {
  const [files, setFiles] = useState<PaymentConfirmationFile[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateFile = useCallback((file: File): string | null => {
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return `File size must be less than ${MAX_FILE_SIZE / (1024 * 1024)}MB`
    }

    // Check file type
    if (!Object.keys(ACCEPTED_FILE_TYPES).includes(file.type)) {
      return 'Only JPG, PNG, WebP, and PDF files are allowed'
    }

    return null
  }, [])

  const generatePreview = useCallback((file: File): Promise<string | undefined> => {
    return new Promise((resolve) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onload = (e) => resolve(e.target?.result as string)
        reader.onerror = () => resolve(undefined)
        reader.readAsDataURL(file)
      } else {
        resolve(undefined)
      }
    })
  }, [])

  const addFiles = useCallback(async (newFiles: File[]) => {
    if (files.length + newFiles.length > maxFiles) {
      toast.error(`Maximum ${maxFiles} files allowed`)
      return
    }

    const validatedFiles: PaymentConfirmationFile[] = []

    for (const file of newFiles) {
      const error = validateFile(file)
      if (error) {
        toast.error(`${file.name}: ${error}`)
        continue
      }

      // Check for duplicates
      if (files.some(f => f.file.name === file.name && f.file.size === file.size)) {
        toast.error(`${file.name} is already added`)
        continue
      }

      const preview = await generatePreview(file)
      validatedFiles.push({
        id: `${Date.now()}-${Math.random()}`,
        file,
        preview,
        status: 'pending',
        progress: 0
      })
    }

    if (validatedFiles.length > 0) {
      setFiles(prev => [...prev, ...validatedFiles])
    }
  }, [files, maxFiles, validateFile, generatePreview])

  const removeFile = useCallback((fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId))
  }, [])

  const uploadFile = useCallback(async (fileData: PaymentConfirmationFile): Promise<void> => {
    const formData = new FormData()
    formData.append('file', fileData.file)
    formData.append('purchaseRequestId', purchaseRequestId)
    formData.append('transactionReference', transactionReference)

    try {
      const response = await fetch('/api/payments/confirmations/upload', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Upload failed')
      }

      const result = await response.json()
      
      setFiles(prev => prev.map(f => 
        f.id === fileData.id 
          ? { ...f, status: 'uploaded', progress: 100, uploadedUrl: result.data.url }
          : f
      ))

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed'
      setFiles(prev => prev.map(f => 
        f.id === fileData.id 
          ? { ...f, status: 'error', error: errorMessage }
          : f
      ))
      throw error
    }
  }, [purchaseRequestId, transactionReference])

  const uploadAllFiles = useCallback(async () => {
    const pendingFiles = files.filter(f => f.status === 'pending')
    if (pendingFiles.length === 0) return

    setIsUploading(true)
    onUploadStart?.()

    // Mark files as uploading
    setFiles(prev => prev.map(f => 
      f.status === 'pending' ? { ...f, status: 'uploading' } : f
    ))

    try {
      await Promise.all(pendingFiles.map(uploadFile))
      
      const uploadedFiles = files.filter(f => f.status === 'uploaded')
      onUploadComplete(uploadedFiles)
      toast.success('Payment confirmations uploaded successfully!')
      
    } catch (error) {
      toast.error('Some files failed to upload. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }, [files, uploadFile, onUploadComplete, onUploadStart])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    if (disabled) return

    const droppedFiles = Array.from(e.dataTransfer.files)
    addFiles(droppedFiles)
  }, [addFiles, disabled])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files)
      addFiles(selectedFiles)
    }
  }, [addFiles])

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <Image className="h-8 w-8 text-blue-500" />
    }
    return <FileText className="h-8 w-8 text-red-500" />
  }

  const getStatusIcon = (status: PaymentConfirmationFile['status']) => {
    switch (status) {
      case 'uploading':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
      case 'uploaded':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return null
    }
  }

  const canUpload = files.some(f => f.status === 'pending') && !isUploading && !disabled
  const hasErrors = files.some(f => f.status === 'error')

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload Payment Confirmation
        </CardTitle>
        <CardDescription>
          Upload screenshots or documents proving your payment. Accepted formats: JPG, PNG, WebP, PDF (max 5MB each)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload Area */}
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            isDragOver
              ? 'border-primary bg-primary/5'
              : 'border-gray-300 hover:border-gray-400'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          onDrop={handleDrop}
          onDragOver={(e) => {
            e.preventDefault()
            if (!disabled) setIsDragOver(true)
          }}
          onDragLeave={() => setIsDragOver(false)}
          onClick={() => !disabled && fileInputRef.current?.click()}
        >
          <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p className="text-lg font-medium mb-2">
            Drop files here or click to browse
          </p>
          <p className="text-sm text-gray-500">
            Maximum {maxFiles} files, 5MB each
          </p>
          
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={Object.keys(ACCEPTED_FILE_TYPES).join(',')}
            onChange={handleFileSelect}
            className="hidden"
            disabled={disabled}
          />
        </div>

        {/* File List */}
        {files.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium">Selected Files</h4>
            {files.map((fileData) => (
              <div key={fileData.id} className="flex items-center gap-3 p-3 border rounded-lg">
                <div className="flex-shrink-0">
                  {fileData.preview ? (
                    <img 
                      src={fileData.preview} 
                      alt={fileData.file.name}
                      className="h-12 w-12 object-cover rounded"
                    />
                  ) : (
                    getFileIcon(fileData.file)
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{fileData.file.name}</p>
                  <p className="text-sm text-gray-500">
                    {(fileData.file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  
                  {fileData.status === 'uploading' && (
                    <Progress value={fileData.progress} className="mt-1" />
                  )}
                  
                  {fileData.error && (
                    <p className="text-sm text-red-500 mt-1">{fileData.error}</p>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  {getStatusIcon(fileData.status)}
                  
                  {fileData.status !== 'uploading' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(fileData.id)}
                      disabled={disabled}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Upload Button */}
        {files.length > 0 && (
          <div className="flex justify-between items-center pt-4 border-t">
            <p className="text-sm text-gray-600">
              {files.length} file{files.length !== 1 ? 's' : ''} selected
            </p>
            
            <Button
              onClick={uploadAllFiles}
              disabled={!canUpload}
              className="min-w-[120px]"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                'Upload Files'
              )}
            </Button>
          </div>
        )}

        {/* Error Alert */}
        {hasErrors && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Some files failed to upload. Please check the errors above and try again.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}
