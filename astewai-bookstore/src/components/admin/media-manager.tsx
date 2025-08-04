'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Upload, 
  Search, 
  Filter, 
  Download, 
  Trash2, 
  Eye, 
  Image, 
  FileText, 
  Folder,
  Grid,
  List,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  X
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { StorageClient } from '@/lib/storage/storage-client'
import { fileUploadService } from '@/lib/storage/file-upload'
import { FileType } from '@/lib/storage/types'

interface MediaFile {
  id: string
  name: string
  size: number
  type: string
  url: string
  thumbnailUrl?: string
  uploadedAt: string
  folder: string
}

interface UploadProgress {
  file: File
  progress: number
  status: 'uploading' | 'completed' | 'error'
  error?: string
  result?: any
}

export function MediaManager() {
  const [files, setFiles] = useState<MediaFile[]>([])
  const [filteredFiles, setFilteredFiles] = useState<MediaFile[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedFolder, setSelectedFolder] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set())
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([])
  const [storageStats, setStorageStats] = useState<any>(null)

  const storageClient = new StorageClient()

  useEffect(() => {
    loadFiles()
    loadStorageStats()
  }, [])

  useEffect(() => {
    filterFiles()
  }, [files, searchTerm, selectedFolder])

  const loadFiles = async () => {
    try {
      setLoading(true)
      const fileList = await storageClient.listFiles('', 1000)
      
      const mediaFiles: MediaFile[] = fileList.map(file => ({
        id: file.name,
        name: file.name.split('/').pop() || file.name,
        size: file.metadata?.size || 0,
        type: file.metadata?.mimetype || 'unknown',
        url: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/books/${file.name}`,
        uploadedAt: file.created_at,
        folder: file.name.includes('/') ? file.name.split('/')[0] : 'root'
      }))

      setFiles(mediaFiles)
    } catch (error) {
      console.error('Failed to load files:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadStorageStats = async () => {
    try {
      const stats = await storageClient.getStorageStats()
      setStorageStats(stats)
    } catch (error) {
      console.error('Failed to load storage stats:', error)
    }
  }

  const filterFiles = () => {
    let filtered = files

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(file =>
        file.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filter by folder
    if (selectedFolder !== 'all') {
      filtered = filtered.filter(file => file.folder === selectedFolder)
    }

    setFilteredFiles(filtered)
  }

  const handleFileUpload = async (uploadFiles: FileList) => {
    const newUploads: UploadProgress[] = Array.from(uploadFiles).map(file => ({
      file,
      progress: 0,
      status: 'uploading' as const
    }))

    setUploadProgress(prev => [...prev, ...newUploads])

    for (let i = 0; i < newUploads.length; i++) {
      const upload = newUploads[i]
      const fileType: FileType = upload.file.type.startsWith('image/') ? 'image' : 'document'

      try {
        const result = await fileUploadService.uploadFile(
          upload.file,
          fileType,
          {
            folder: 'uploads',
            optimizeImage: upload.file.type.startsWith('image/'),
            generateThumbnail: upload.file.type.startsWith('image/')
          },
          (progress) => {
            setUploadProgress(prev => prev.map((item, index) => 
              index === prev.length - newUploads.length + i
                ? { ...item, progress: progress.percentage }
                : item
            ))
          }
        )

        setUploadProgress(prev => prev.map((item, index) => 
          index === prev.length - newUploads.length + i
            ? { ...item, status: 'completed', result }
            : item
        ))

      } catch (error) {
        setUploadProgress(prev => prev.map((item, index) => 
          index === prev.length - newUploads.length + i
            ? { 
                ...item, 
                status: 'error', 
                error: error instanceof Error ? error.message : 'Upload failed' 
              }
            : item
        ))
      }
    }

    // Refresh file list after uploads
    setTimeout(() => {
      loadFiles()
      loadStorageStats()
    }, 1000)
  }

  const handleDeleteFiles = async () => {
    if (selectedFiles.size === 0) return

    try {
      const fileNames = Array.from(selectedFiles)
      await storageClient.deleteFiles(fileNames)
      
      setSelectedFiles(new Set())
      loadFiles()
      loadStorageStats()
    } catch (error) {
      console.error('Failed to delete files:', error)
    }
  }

  const toggleFileSelection = (fileId: string) => {
    const newSelection = new Set(selectedFiles)
    if (newSelection.has(fileId)) {
      newSelection.delete(fileId)
    } else {
      newSelection.add(fileId)
    }
    setSelectedFiles(newSelection)
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <Image className="w-4 h-4" />
    return <FileText className="w-4 h-4" />
  }

  const folders = Array.from(new Set(files.map(f => f.folder)))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Media Manager</h2>
          <p className="text-muted-foreground">
            Manage uploaded files and media assets
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
          >
            {viewMode === 'grid' ? <List className="w-4 h-4" /> : <Grid className="w-4 h-4" />}
          </Button>
          <Button variant="outline" size="sm" onClick={loadFiles}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Storage Stats */}
      {storageStats && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Storage Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{storageStats.totalFiles}</div>
                <div className="text-sm text-muted-foreground">Total Files</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{formatFileSize(storageStats.totalSize)}</div>
                <div className="text-sm text-muted-foreground">Total Size</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{Object.keys(storageStats.folderStats).length}</div>
                <div className="text-sm text-muted-foreground">Folders</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Upload Files</CardTitle>
          <CardDescription>
            Drag and drop files here or click to browse
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8">
            <div className="text-center">
              <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <input
                type="file"
                multiple
                onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload">
                <Button variant="outline" asChild>
                  <span>Choose Files</span>
                </Button>
              </label>
              <p className="text-sm text-muted-foreground mt-2">
                Support for images, documents, and book files
              </p>
            </div>
          </div>

          {/* Upload Progress */}
          {uploadProgress.length > 0 && (
            <div className="mt-4 space-y-2">
              {uploadProgress.map((upload, index) => (
                <div key={index} className="flex items-center space-x-2 p-2 bg-muted rounded">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{upload.file.name}</span>
                      <div className="flex items-center space-x-2">
                        {upload.status === 'completed' && (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        )}
                        {upload.status === 'error' && (
                          <AlertCircle className="w-4 h-4 text-red-500" />
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setUploadProgress(prev => prev.filter((_, i) => i !== index))}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    {upload.status === 'uploading' && (
                      <Progress value={upload.progress} className="h-2" />
                    )}
                    {upload.status === 'error' && (
                      <p className="text-xs text-red-500">{upload.error}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Filters and Search */}
      <div className="flex items-center space-x-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search files..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <select
          value={selectedFolder}
          onChange={(e) => setSelectedFolder(e.target.value)}
          className="px-3 py-2 border rounded-md"
        >
          <option value="all">All Folders</option>
          {folders.map(folder => (
            <option key={folder} value={folder}>{folder}</option>
          ))}
        </select>
        {selectedFiles.size > 0 && (
          <Button variant="destructive" size="sm" onClick={handleDeleteFiles}>
            <Trash2 className="w-4 h-4 mr-2" />
            Delete ({selectedFiles.size})
          </Button>
        )}
      </div>

      {/* File List */}
      <Card>
        <CardContent className="p-6">
          {loading ? (
            <div className="text-center py-8">
              <RefreshCw className="w-8 h-8 mx-auto animate-spin text-muted-foreground mb-2" />
              <p className="text-muted-foreground">Loading files...</p>
            </div>
          ) : filteredFiles.length === 0 ? (
            <div className="text-center py-8">
              <Folder className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground">No files found</p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {filteredFiles.map(file => (
                <div
                  key={file.id}
                  className={cn(
                    "border rounded-lg p-3 cursor-pointer hover:bg-muted/50 transition-colors",
                    selectedFiles.has(file.id) && "border-primary bg-primary/10"
                  )}
                  onClick={() => toggleFileSelection(file.id)}
                >
                  <div className="aspect-square bg-muted rounded mb-2 flex items-center justify-center">
                    {file.type.startsWith('image/') ? (
                      <img
                        src={file.thumbnailUrl || file.url}
                        alt={file.name}
                        className="w-full h-full object-cover rounded"
                      />
                    ) : (
                      getFileIcon(file.type)
                    )}
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-medium truncate" title={file.name}>
                      {file.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(file.size)}
                    </p>
                    <Badge variant="secondary" className="text-xs">
                      {file.folder}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredFiles.map(file => (
                <div
                  key={file.id}
                  className={cn(
                    "flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors",
                    selectedFiles.has(file.id) && "border-primary bg-primary/10"
                  )}
                  onClick={() => toggleFileSelection(file.id)}
                >
                  <div className="w-10 h-10 bg-muted rounded flex items-center justify-center">
                    {file.type.startsWith('image/') ? (
                      <img
                        src={file.thumbnailUrl || file.url}
                        alt={file.name}
                        className="w-full h-full object-cover rounded"
                      />
                    ) : (
                      getFileIcon(file.type)
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{file.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatFileSize(file.size)} • {file.folder}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="sm" asChild>
                      <a href={file.url} target="_blank" rel="noopener noreferrer">
                        <Eye className="w-4 h-4" />
                      </a>
                    </Button>
                    <Button variant="ghost" size="sm" asChild>
                      <a href={file.url} download>
                        <Download className="w-4 h-4" />
                      </a>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}