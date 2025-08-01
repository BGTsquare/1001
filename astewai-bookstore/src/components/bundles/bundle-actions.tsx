'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ShoppingCart, Loader2, Package, MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/auth-context'
import { PurchaseRequestFormComponent, PurchaseContactModal, QuickContactButtons } from '@/components/contact'
import type { Bundle } from '@/types'
import { toast } from 'sonner'

interface BundleActionsProps {
  bundle: Bundle
}

export function BundleActions({ bundle }: BundleActionsProps) {
  const { user } = useAuth()
  const router = useRouter()
  const [isPurchasing, setIsPurchasing] = useState(false)

  const handlePurchase = async () => {
    if (!user) {
      router.push('/auth/login?redirect=/bundles/' + bundle.id)
      return
    }

    setIsPurchasing(true)
    
    try {
      const response = await fetch('/api/purchases/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          itemType: 'bundle',
          itemId: bundle.id,
          amount: bundle.price,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to initiate bundle purchase')
      }

      // Redirect to checkout or payment page
      if (result.checkoutUrl) {
        window.location.href = result.checkoutUrl
      } else {
        // Handle manual approval flow
        toast.success('Bundle purchase request submitted for approval!')
        router.push('/profile?tab=purchases')
      }
    } catch (error) {
      console.error('Error initiating bundle purchase:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to initiate bundle purchase')
    } finally {
      setIsPurchasing(false)
    }
  }

  return (
    <div className="space-y-3">
      <Button
        onClick={handlePurchase}
        disabled={isPurchasing}
        className="w-full"
        size="lg"
      >
        {isPurchasing ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <ShoppingCart className="h-4 w-4 mr-2" />
            Buy Bundle
          </>
        )}
      </Button>
      
      <div className="grid grid-cols-2 gap-2">
        <PurchaseRequestFormComponent
          item={bundle}
          itemType="bundle"
          trigger={
            <Button variant="outline" className="w-full" size="lg">
              <MessageCircle className="h-4 w-4 mr-2" />
              Request Purchase
            </Button>
          }
        />
        
        <PurchaseContactModal
          item={bundle}
          itemType="bundle"
          trigger={
            <Button variant="outline" className="w-full" size="lg">
              <MessageCircle className="h-4 w-4 mr-2" />
              Contact Admin
            </Button>
          }
          onContactInitiated={(method) => {
            console.log(`Contact initiated via ${method} for bundle ${bundle.id}`);
          }}
        />
      </div>
      
      <QuickContactButtons
        item={bundle}
        itemType="bundle"
        onContactInitiated={(method) => {
          console.log(`Quick contact initiated via ${method} for bundle ${bundle.id}`);
        }}
        className="border rounded-lg p-3"
      />
    </div>
  )
}