'use client'

import { useState } from 'react'
import { Copy, Check, CreditCard, Smartphone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'

export interface PaymentInstruction {
  id: string
  type: 'bank_account' | 'mobile_money'
  provider: string
  accountNumber: string
  accountName: string
  instructions: string
  displayOrder: number
}

interface ManualPaymentInstructionsProps {
  amount: number
  transactionReference: string
  itemTitle: string
  itemType: 'book' | 'bundle'
  paymentInstructions: PaymentInstruction[]
  onPaymentSent: () => void
  isLoading?: boolean
}

export function ManualPaymentInstructions({
  amount,
  transactionReference,
  itemTitle,
  itemType,
  paymentInstructions,
  onPaymentSent,
  isLoading = false
}: ManualPaymentInstructionsProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null)

  const copyToClipboard = async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(fieldName)
      toast.success(`${fieldName} copied to clipboard`)
      setTimeout(() => setCopiedField(null), 2000)
    } catch (error) {
      toast.error('Failed to copy to clipboard')
    }
  }

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-ET', {
      style: 'currency',
      currency: 'ETB',
      minimumFractionDigits: 2
    }).format(amount)
  }

  const getPaymentIcon = (type: 'bank_account' | 'mobile_money') => {
    return type === 'bank_account' ? CreditCard : Smartphone
  }

  return (
    <div className="space-y-6">
      {/* Purchase Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Purchase Summary</CardTitle>
          <CardDescription>
            Complete your payment to access your {itemType}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="font-medium">{itemTitle}</span>
            <span className="text-lg font-bold">{formatAmount(amount)}</span>
          </div>
          
          <Separator />
          
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-900">Transaction Reference</p>
                <p className="text-lg font-mono font-bold text-blue-700">{transactionReference}</p>
                <p className="text-xs text-blue-600 mt-1">
                  Include this reference in your payment description
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(transactionReference, 'Transaction Reference')}
                className="border-blue-300 text-blue-700 hover:bg-blue-100"
              >
                {copiedField === 'Transaction Reference' ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Instructions */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Payment Options</h3>
        
        {paymentInstructions.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-gray-500">No payment methods available at the moment.</p>
              <p className="text-sm text-gray-400 mt-2">Please contact support for assistance.</p>
            </CardContent>
          </Card>
        ) : (
          paymentInstructions.map((instruction) => {
            const Icon = getPaymentIcon(instruction.type)
            
            return (
              <Card key={instruction.id} className="border-2">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <Icon className="h-5 w-5 text-gray-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{instruction.provider}</CardTitle>
                      <CardDescription className="capitalize">
                        {instruction.type.replace('_', ' ')}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Account Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        {instruction.type === 'bank_account' ? 'Account Number' : 'Phone Number'}
                      </label>
                      <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border">
                        <span className="font-mono flex-1">{instruction.accountNumber}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(instruction.accountNumber, 'Account Number')}
                        >
                          {copiedField === 'Account Number' ? (
                            <Check className="h-4 w-4 text-green-600" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Account Name</label>
                      <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border">
                        <span className="flex-1">{instruction.accountName}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(instruction.accountName, 'Account Name')}
                        >
                          {copiedField === 'Account Name' ? (
                            <Check className="h-4 w-4 text-green-600" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Instructions */}
                  {instruction.instructions && (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-yellow-800">
                        <strong>Instructions:</strong> {instruction.instructions}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      {/* Important Notes */}
      <Card className="border-orange-200 bg-orange-50">
        <CardContent className="p-4">
          <h4 className="font-semibold text-orange-900 mb-2">Important Notes:</h4>
          <ul className="text-sm text-orange-800 space-y-1">
            <li>• Transfer exactly <strong>{formatAmount(amount)}</strong> to complete your purchase</li>
            <li>• Include the transaction reference <strong>{transactionReference}</strong> in your payment description</li>
            <li>• Your purchase will be processed within 24 hours after payment verification</li>
            <li>• Keep your payment receipt for reference</li>
          </ul>
        </CardContent>
      </Card>

      {/* Confirmation Button */}
      <div className="flex justify-center pt-4">
        <Button
          onClick={onPaymentSent}
          disabled={isLoading}
          size="lg"
          className="w-full md:w-auto px-8"
        >
          {isLoading ? 'Processing...' : 'I Have Sent The Payment, Please Verify'}
        </Button>
      </div>
    </div>
  )
}