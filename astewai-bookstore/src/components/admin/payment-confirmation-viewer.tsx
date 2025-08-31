'use client'

import { useState, useEffect } from 'react'
import { FileText, Image, Download, Eye, Calendar, User, AlertCircle, CheckCircle, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from 'sonner'

interface PaymentConfirmation {
  id: string
  file_name: string
  file_path: string
  file_size: number
  file_type: string
  status: 'pending' | 'approved' | 'rejected' | 'invalid'
  admin_notes?: string
  admin_reviewed_by?: string
  reviewed_at?: string
  created_at: string
  updated_at: string
  downloadUrl?: string
}

interface PaymentConfirmationViewerProps {
  purchaseRequestId: string
  isOpen: boolean
  onClose: () => void
  onStatusUpdate?: (confirmationId: string, status: string, notes?: string) => void
}

export function PaymentConfirmationViewer({
  purchaseRequestId,
  isOpen,
  onClose,
  onStatusUpdate
}: PaymentConfirmationViewerProps) {
  const [confirmations, setConfirmations] = useState<PaymentConfirmation[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && purchaseRequestId) {
      fetchConfirmations()
    }
  }, [isOpen, purchaseRequestId])

  const fetchConfirmations = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch(`/api/payments/confirmations/${purchaseRequestId}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch payment confirmations')
      }

      const { data } = await response.json()
      setConfirmations(data || [])

    } catch (error) {
      console.error('Error fetching payment confirmations:', error)
      setError(error instanceof Error ? error.message : 'Failed to load confirmations')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownload = async (confirmation: PaymentConfirmation) => {
    if (!confirmation.downloadUrl) {
      toast.error('Download URL not available')
      return
    }

    try {
      const response = await fetch(confirmation.downloadUrl)
      if (!response.ok) throw new Error('Download failed')

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = confirmation.file_name
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast.success('File downloaded successfully')
    } catch (error) {
      console.error('Download error:', error)
      toast.error('Failed to download file')
    }
  }

  const handleView = (confirmation: PaymentConfirmation) => {
    if (confirmation.file_type.startsWith('image/') && confirmation.downloadUrl) {
      setSelectedImage(confirmation.downloadUrl)
    } else if (confirmation.downloadUrl) {
      window.open(confirmation.downloadUrl, '_blank')
    } else {
      toast.error('File preview not available')
    }
  }

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) {
      return <Image className="h-5 w-5 text-blue-500" />
    }
    return <FileText className="h-5 w-5 text-red-500" />
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'invalid':
        return <AlertCircle className="h-4 w-4 text-orange-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800'
      case 'rejected':
        return 'bg-red-100 text-red-800'
      case 'invalid':
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-yellow-100 text-yellow-800'
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Payment Confirmations</DialogTitle>
            <DialogDescription>
              Review uploaded payment confirmation files for this purchase request
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading confirmations...</p>
              </div>
            ) : error ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : confirmations.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No payment confirmations uploaded yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {confirmations.map((confirmation) => (
                  <Card key={confirmation.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          {getFileIcon(confirmation.file_type)}
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium truncate">{confirmation.file_name}</h4>
                              <Badge className={getStatusColor(confirmation.status)}>
                                {confirmation.status}
                              </Badge>
                            </div>
                            
                            <div className="text-sm text-gray-600 space-y-1">
                              <p>Size: {formatFileSize(confirmation.file_size)}</p>
                              <p>Type: {confirmation.file_type}</p>
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                <span>Uploaded: {formatDate(confirmation.created_at)}</span>
                              </div>
                              
                              {confirmation.reviewed_at && (
                                <div className="flex items-center gap-1">
                                  <User className="h-3 w-3" />
                                  <span>Reviewed: {formatDate(confirmation.reviewed_at)}</span>
                                </div>
                              )}
                            </div>

                            {confirmation.admin_notes && (
                              <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                                <strong>Admin Notes:</strong> {confirmation.admin_notes}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 ml-4">
                          {getStatusIcon(confirmation.status)}
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleView(confirmation)}
                            disabled={!confirmation.downloadUrl}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownload(confirmation)}
                            disabled={!confirmation.downloadUrl}
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Download
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Image Preview Modal */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Payment Confirmation Preview</DialogTitle>
          </DialogHeader>
          {selectedImage && (
            <div className="flex justify-center">
              <img
                src={selectedImage}
                alt="Payment confirmation"
                className="max-w-full max-h-[70vh] object-contain rounded-lg"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
