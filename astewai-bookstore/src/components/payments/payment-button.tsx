'use client'

import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ShoppingCart, Smartphone, CreditCard, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/auth-context'
import type { Book, Bundle } from '@/types'
import type { PaymentButtonProps, WalletConfig } from '@/lib/types/payment'

export function PaymentButton({ 
  item, 
  itemType, 
  className, 
  onPaymentInitiated,
  onPaymentCompleted 
}: PaymentButtonProps) {
  const { user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [step, setStep] = useState<'wallet' | 'payment' | 'confirmation' | 'success'>('wallet')
  const [selectedWallet, setSelectedWallet] = useState<WalletConfig | null>(null)
  const [paymentRequest, setPaymentRequest] = useState<any>(null)
  const [wallets, setWallets] = useState<WalletConfig[]>([])

  // Fetch wallets
  const fetchWallets = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/payments/wallets')
      if (!response.ok) {
        throw new Error('Failed to fetch wallets')
      }
      return response.json()
    },
    onSuccess: (data) => {
      if (data.success) {
        setWallets(data.data)
      }
    },
    onError: (error) => {
      toast.error('Failed to load payment options')
    }
  })

  // Initiate payment
  const initiatePayment = useMutation({
    mutationFn: async (walletId?: string) => {
      const response = await fetch('/api/payments/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          item_type: itemType,
          item_id: item.id,
          amount: item.price,
          currency: 'ETB',
          selected_wallet_id: walletId
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to initiate payment')
      }

      return response.json()
    },
    onSuccess: (data) => {
      if (data.success) {
        setPaymentRequest(data.data.paymentRequest)
        setSelectedWallet(data.data.walletConfig)
        setStep('payment')
        onPaymentInitiated?.(data.data.paymentRequest)
        toast.success('Payment initiated! Please follow the instructions below.')
      }
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to initiate payment')
    }
  })

  // Record deep link click
  const recordDeepLinkClick = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/payments/${paymentRequest.id}/deep-link-click`, {
        method: 'POST'
      })

      if (!response.ok) {
        throw new Error('Failed to record deep link click')
      }

      return response.json()
    },
    onSuccess: () => {
      toast.success('Opening wallet app...')
    },
    onError: (error) => {
      toast.error('Failed to open wallet app')
    }
  })

  const handleWalletSelect = (wallet: WalletConfig) => {
    setSelectedWallet(wallet)
    initiatePayment.mutate(wallet.id)
  }

  const handleDeepLinkClick = () => {
    if (selectedWallet && paymentRequest) {
      // Open deep link
      window.open(selectedWallet.deep_link_template
        .replace('{amount}', paymentRequest.amount.toString())
        .replace('{reference}', paymentRequest.id)
        .replace('{currency}', 'ETB'), '_blank')
      
      // Record the click
      recordDeepLinkClick.mutate()
    }
  }

  const handleClose = () => {
    setIsOpen(false)
    setStep('wallet')
    setSelectedWallet(null)
    setPaymentRequest(null)
  }

  const getWalletIcon = (walletType: string) => {
    switch (walletType) {
      case 'mobile_money':
        return <Smartphone className="h-5 w-5 text-green-600" />
      case 'bank_app':
        return <CreditCard className="h-5 w-5 text-blue-600" />
      default:
        return <Smartphone className="h-5 w-5 text-gray-600" />
    }
  }

  if (!user) {
    return (
      <Button className={className} onClick={() => toast.error('Please sign in to purchase')}>
        <ShoppingCart className="mr-2 h-4 w-4" />
        Purchase - {item.price} ETB
      </Button>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className={className} onClick={() => fetchWallets.mutate()}>
          <ShoppingCart className="mr-2 h-4 w-4" />
          Purchase - {item.price} ETB
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {step === 'wallet' && 'Choose Payment Method'}
            {step === 'payment' && 'Complete Payment'}
            {step === 'confirmation' && 'Payment Confirmation'}
            {step === 'success' && 'Payment Successful'}
          </DialogTitle>
        </DialogHeader>

        {step === 'wallet' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Purchase Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-4">
                  {item.cover_image_url && (
                    <img 
                      src={item.cover_image_url} 
                      alt={item.title}
                      className="w-16 h-20 object-cover rounded"
                    />
                  )}
                  <div>
                    <h3 className="font-semibold">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {itemType === 'book' ? 'Book' : 'Bundle'}
                    </p>
                    <Badge variant="secondary" className="mt-1">
                      {item.price} ETB
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <h3 className="font-medium">Select Payment Method</h3>
              {fetchWallets.isPending ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-2 text-sm text-muted-foreground">Loading payment options...</p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {wallets.map((wallet) => (
                    <Card 
                      key={wallet.id} 
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => handleWalletSelect(wallet)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-3">
                          {getWalletIcon(wallet.wallet_type)}
                          <div className="flex-1">
                            <h4 className="font-medium">{wallet.wallet_name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {wallet.instructions}
                            </p>
                          </div>
                          <ExternalLink className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {step === 'payment' && selectedWallet && paymentRequest && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Payment Instructions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm font-medium text-blue-900">Reference ID</p>
                  <code className="text-lg font-mono text-blue-700">
                    {paymentRequest.id}
                  </code>
                  <p className="text-xs text-blue-600 mt-2">
                    Include this reference in your payment description
                  </p>
                </div>

                <div className="space-y-4">
                  <Card className="border-l-4 border-l-primary">
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2 mb-3">
                        {getWalletIcon(selectedWallet.wallet_type)}
                        <h4 className="font-medium">{selectedWallet.wallet_name}</h4>
                      </div>
                      <p className="text-sm text-muted-foreground mb-4">
                        {selectedWallet.instructions}
                      </p>
                      <Button 
                        onClick={handleDeepLinkClick}
                        className="w-full"
                        disabled={recordDeepLinkClick.isPending}
                      >
                        {recordDeepLinkClick.isPending ? 'Opening...' : 'Open Wallet App'}
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep('wallet')}>
                Back
              </Button>
              <Button onClick={() => setStep('confirmation')}>
                I Have Made Payment
              </Button>
            </div>
          </div>
        )}

        {step === 'confirmation' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Payment Confirmation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  Please provide your transaction details to complete the verification process.
                </p>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Transaction ID</label>
                    <input
                      type="text"
                      placeholder="Enter your transaction ID"
                      className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Amount (Optional)</label>
                    <input
                      type="number"
                      placeholder="Enter amount paid"
                      className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep('payment')}>
                Back
              </Button>
              <Button onClick={() => setStep('success')}>
                Submit Confirmation
              </Button>
            </div>
          </div>
        )}

        {step === 'success' && (
          <div className="text-center space-y-4 py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <ShoppingCart className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold">Payment Submitted!</h3>
            <p className="text-muted-foreground">
              We will verify your payment and approve your purchase within 24 hours. 
              You'll receive an email notification once approved.
            </p>
            <Button onClick={handleClose}>
              Close
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}


