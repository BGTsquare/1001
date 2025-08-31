'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { ManualPaymentInstructions, PaymentInstruction } from '@/components/payments/manual-payment-instructions'
import { PaymentConfirmationUpload } from '@/components/payments/payment-confirmation-upload'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, Loader2, CheckCircle, Upload } from 'lucide-react'
import { toast } from 'sonner'

interface PurchaseData {
  id: string
  amount: number
  itemTitle: string
  itemType: 'book' | 'bundle'
  transactionReference: string
  paymentMethods: PaymentInstruction[]
}

interface PaymentConfirmation {
  id: string
  fileName: string
  fileSize: number
  fileType: string
  status: 'pending' | 'approved' | 'rejected' | 'invalid'
  uploadedAt: string
  downloadUrl?: string
}

function PaymentInstructionsContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const purchaseId = searchParams.get('purchaseId')
  
  const [purchaseData, setPurchaseData] = useState<PurchaseData | null>(null)
  const [paymentConfirmations, setPaymentConfirmations] = useState<PaymentConfirmation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isConfirming, setIsConfirming] = useState(false)
  const [isLoadingConfirmations, setIsLoadingConfirmations] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [paymentStep, setPaymentStep] = useState<'instructions' | 'upload' | 'complete'>('instructions')

  useEffect(() => {
    if (!purchaseId) {
      setError('No purchase ID provided')
      setIsLoading(false)
      return
    }

    fetchPurchaseData()
    fetchPaymentConfirmations()
  }, [purchaseId])

  const fetchPurchaseData = async () => {
    try {
      setIsLoading(true)
      
      // Fetch purchase request details
      const response = await fetch(`/api/purchase-requests/${purchaseId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch purchase details')
      }
      
      const { data: purchaseRequest } = await response.json()
      
      // Fetch payment methods
      const paymentResponse = await fetch('/api/payments/config')
      if (!paymentResponse.ok) {
        throw new Error('Failed to fetch payment methods')
      }
      
      const { data: paymentMethods } = await paymentResponse.json()
      
      // Format the data
      const itemTitle = purchaseRequest.book?.title || purchaseRequest.bundle?.title || 'Unknown Item'
      const formattedPaymentMethods = paymentMethods.map((method: any) => ({
        id: method.id,
        type: method.config_type,
        provider: method.provider_name,
        accountNumber: method.account_number,
        accountName: method.account_name,
        instructions: method.instructions || '',
        displayOrder: method.display_order || 0
      }))
      
      setPurchaseData({
        id: purchaseRequest.id,
        amount: purchaseRequest.amount,
        itemTitle,
        itemType: purchaseRequest.item_type,
        transactionReference: `AST-${purchaseRequest.id.slice(-8).toUpperCase()}`,
        paymentMethods: formattedPaymentMethods
      })
      
    } catch (error) {
      console.error('Error fetching purchase data:', error)
      setError(error instanceof Error ? error.message : 'Failed to load purchase details')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchPaymentConfirmations = async () => {
    if (!purchaseId) return

    try {
      setIsLoadingConfirmations(true)
      const response = await fetch(`/api/payments/confirmations/${purchaseId}`)

      if (response.ok) {
        const { data } = await response.json()
        setPaymentConfirmations(data || [])

        // If there are confirmations, move to upload step
        if (data && data.length > 0) {
          setPaymentStep('upload')
        }
      }
    } catch (error) {
      console.error('Error fetching payment confirmations:', error)
    } finally {
      setIsLoadingConfirmations(false)
    }
  }

  const handleUploadComplete = async (uploadedFiles: any[]) => {
    // Refresh payment confirmations
    await fetchPaymentConfirmations()

    // Move to complete step
    setPaymentStep('complete')

    // Update purchase request status to 'contacted'
    if (purchaseData) {
      try {
        await fetch(`/api/purchase-requests/${purchaseData.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            status: 'contacted',
            contacted_at: new Date().toISOString()
          }),
        })
      } catch (error) {
        console.error('Error updating purchase request status:', error)
      }
    }

    toast.success('Payment confirmations uploaded successfully! We will review and approve your purchase soon.')
  }

  const handleUploadStart = () => {
    setPaymentStep('upload')
  }

  const handlePaymentSent = async () => {
    if (!purchaseData) return
    
    try {
      setIsConfirming(true)
      
      const response = await fetch(`/api/purchase-requests/${purchaseData.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'contacted',
          contacted_at: new Date().toISOString()
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to confirm payment')
      }

      toast.success('Payment confirmation sent! We will verify and approve your purchase soon.')
      router.push('/purchase-requests')
      
    } catch (error) {
      console.error('Error confirming payment:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to confirm payment')
    } finally {
      setIsConfirming(false)
    }
  }

  const handleGoBack = () => {
    router.back()
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="flex items-center justify-center p-8">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                <p className="text-gray-600">Loading payment instructions...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (error || !purchaseData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-red-600">Error</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600">
                {error || 'Purchase details not found'}
              </p>
              <div className="flex gap-4">
                <Button onClick={handleGoBack} variant="outline">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Go Back
                </Button>
                <Button onClick={() => router.push('/purchase-requests')}>
                  View My Purchases
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button 
            onClick={handleGoBack} 
            variant="ghost" 
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold">Complete Your Payment</h1>
          <p className="text-gray-600 mt-2">
            Follow the instructions below to complete your purchase
          </p>
        </div>

        <div className="space-y-6">
          {/* Payment Instructions */}
          <ManualPaymentInstructions
            amount={purchaseData.amount}
            transactionReference={purchaseData.transactionReference}
            itemTitle={purchaseData.itemTitle}
            itemType={purchaseData.itemType}
            paymentInstructions={purchaseData.paymentMethods}
            onPaymentSent={handlePaymentSent}
            isLoading={isConfirming}
          />

          <Separator />

          {/* Payment Confirmation Upload */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              <h2 className="text-xl font-semibold">Upload Payment Confirmation</h2>
            </div>
            <p className="text-gray-600">
              After making your payment, upload a screenshot or document as proof of payment.
              This will help us verify and approve your purchase faster.
            </p>

            {paymentStep === 'complete' && paymentConfirmations.length > 0 ? (
              <Card className="border-green-200 bg-green-50">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                    <div>
                      <h3 className="font-semibold text-green-800">Payment Confirmations Uploaded</h3>
                      <p className="text-green-700">
                        We have received your payment confirmations and will review them shortly.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium text-green-800">Uploaded Files:</h4>
                    {paymentConfirmations.map((confirmation) => (
                      <div key={confirmation.id} className="flex items-center justify-between p-2 bg-white rounded border">
                        <div>
                          <p className="font-medium">{confirmation.fileName}</p>
                          <p className="text-sm text-gray-600">
                            {(confirmation.fileSize / 1024 / 1024).toFixed(2)} MB •
                            Status: <span className="capitalize">{confirmation.status}</span>
                          </p>
                        </div>
                        {confirmation.downloadUrl && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(confirmation.downloadUrl, '_blank')}
                          >
                            View
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 pt-4 border-t border-green-200">
                    <Button
                      onClick={() => router.push('/purchase-requests')}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      View My Purchase Requests
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <PaymentConfirmationUpload
                purchaseRequestId={purchaseData.id}
                transactionReference={purchaseData.transactionReference}
                onUploadComplete={handleUploadComplete}
                onUploadStart={handleUploadStart}
                disabled={isConfirming || isLoadingConfirmations}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function PaymentInstructionsPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="flex items-center justify-center p-8">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                <p className="text-gray-600">Loading payment instructions...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    }>
      <PaymentInstructionsContent />
    </Suspense>
  )
}
