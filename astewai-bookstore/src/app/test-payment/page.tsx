'use client'

import { useState } from 'react'
import { ManualPaymentInstructions } from '@/components/payments/manual-payment-instructions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

export default function TestPaymentPage() {
  const [purchaseData, setPurchaseData] = useState<any>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [isConfirming, setIsConfirming] = useState(false)

  const createTestPurchase = async () => {
    setIsCreating(true)
    try {
      const response = await fetch('/api/purchases/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          itemType: 'book',
          itemId: '5f0e5987-d9c7-426f-9948-31f3ba49d584' // Test book ID
        })
      })

      const data = await response.json()
      
      if (response.ok && data.success) {
        setPurchaseData(data.data)
        toast.success('Purchase created successfully!')
      } else {
        toast.error(data.error || 'Failed to create purchase')
      }
    } catch (error) {
      console.error('Error creating purchase:', error)
      toast.error('Failed to create purchase')
    } finally {
      setIsCreating(false)
    }
  }

  const handlePaymentSent = async () => {
    setIsConfirming(true)
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      toast.success('Payment confirmation received! Your purchase is now pending verification.')
    } catch (error) {
      toast.error('Failed to confirm payment')
    } finally {
      setIsConfirming(false)
    }
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Test Manual Payment System</h1>
        <p className="text-gray-600">Test the manual payment flow for the bookstore</p>
      </div>

      {!purchaseData ? (
        <Card>
          <CardHeader>
            <CardTitle>Create Test Purchase</CardTitle>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={createTestPurchase} 
              disabled={isCreating}
              size="lg"
            >
              {isCreating ? 'Creating Purchase...' : 'Create Test Purchase'}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <ManualPaymentInstructions
          amount={purchaseData.amount}
          transactionReference={purchaseData.transactionReference}
          itemTitle={purchaseData.itemTitle}
          itemType={purchaseData.itemType}
          paymentInstructions={purchaseData.paymentInstructions}
          onPaymentSent={handlePaymentSent}
          isLoading={isConfirming}
        />
      )}
    </div>
  )
}