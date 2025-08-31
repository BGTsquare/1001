'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, CreditCard, Smartphone, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/auth-context';
import type { Book, Bundle } from '@/types';

interface SimplePurchaseButtonProps {
  item: Book | Bundle;
  itemType: 'book' | 'bundle';
  className?: string;
}

interface PaymentMethod {
  id: string;
  type: 'bank_account' | 'mobile_money';
  provider: string;
  accountNumber: string;
  accountName: string;
  instructions: string;
}

export function SimplePurchaseButton({ item, itemType, className }: SimplePurchaseButtonProps) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<'confirm' | 'payment' | 'success'>('confirm');
  const [userMessage, setUserMessage] = useState('');
  const [purchaseData, setPurchaseData] = useState<{
    id: string;
    transactionReference: string;
    paymentMethods: PaymentMethod[];
  } | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Create purchase mutation
  const createPurchaseMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/purchases/simple', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemType,
          itemId: item.id,
          amount: item.price,
          userMessage: userMessage.trim() || undefined
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create purchase');
      }

      return response.json();
    },
    onSuccess: (data) => {
      setPurchaseData(data);
      setStep('payment');
      toast.success('Purchase request created! Please make payment using the instructions below.');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create purchase request');
    }
  });

  // Confirm payment mutation
  const confirmPaymentMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/purchases/${purchaseData?.id}/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to confirm payment');
      }

      return response.json();
    },
    onSuccess: () => {
      setStep('success');
      toast.success('Payment confirmation sent! We will verify and approve your purchase soon.');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to confirm payment');
    }
  });

  const handleCreatePurchase = () => {
    createPurchaseMutation.mutate();
  };

  const handleConfirmPayment = () => {
    confirmPaymentMutation.mutate();
  };

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      toast.success('Copied to clipboard!');
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setStep('confirm');
    setUserMessage('');
    setPurchaseData(null);
    setCopiedField(null);
  };

  if (!user) {
    return (
      <Button className={className} onClick={() => toast.error('Please sign in to purchase')}>
        <ShoppingCart className="mr-2 h-4 w-4" />
        Purchase - {item.price} ETB
      </Button>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className={className}>
          <ShoppingCart className="mr-2 h-4 w-4" />
          Purchase - {item.price} ETB
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {step === 'confirm' && 'Confirm Purchase'}
            {step === 'payment' && 'Payment Instructions'}
            {step === 'success' && 'Purchase Request Submitted'}
          </DialogTitle>
        </DialogHeader>

        {step === 'confirm' && (
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
                
                <div>
                  <label className="text-sm font-medium">Message (Optional)</label>
                  <Textarea
                    placeholder="Any special requests or questions..."
                    value={userMessage}
                    onChange={(e) => setUserMessage(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button 
                onClick={handleCreatePurchase}
                disabled={createPurchaseMutation.isPending}
              >
                {createPurchaseMutation.isPending ? 'Creating...' : 'Create Purchase Request'}
              </Button>
            </div>
          </div>
        )}

        {step === 'payment' && purchaseData && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Payment Instructions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm font-medium text-blue-900">Transaction Reference</p>
                  <div className="flex items-center justify-between mt-1">
                    <code className="text-lg font-mono text-blue-700">
                      {purchaseData.transactionReference}
                    </code>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(purchaseData.transactionReference, 'ref')}
                    >
                      {copiedField === 'ref' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-blue-600 mt-2">
                    Include this reference in your payment description
                  </p>
                </div>

                <div className="space-y-4">
                  {purchaseData.paymentMethods.map((method) => (
                    <Card key={method.id} className="border-l-4 border-l-primary">
                      <CardHeader className="pb-3">
                        <div className="flex items-center space-x-2">
                          {method.type === 'mobile_money' ? (
                            <Smartphone className="h-5 w-5 text-green-600" />
                          ) : (
                            <CreditCard className="h-5 w-5 text-blue-600" />
                          )}
                          <CardTitle className="text-base">{method.provider}</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm font-medium">Account Number</p>
                            <div className="flex items-center justify-between">
                              <code className="text-sm">{method.accountNumber}</code>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => copyToClipboard(method.accountNumber, method.id + '-number')}
                              >
                                {copiedField === method.id + '-number' ? 
                                  <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />
                                }
                              </Button>
                            </div>
                          </div>
                          <div>
                            <p className="text-sm font-medium">Account Name</p>
                            <p className="text-sm">{method.accountName}</p>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Instructions</p>
                          <p className="text-sm text-muted-foreground">{method.instructions}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button 
                onClick={handleConfirmPayment}
                disabled={confirmPaymentMutation.isPending}
              >
                {confirmPaymentMutation.isPending ? 'Confirming...' : 'I Have Made Payment'}
              </Button>
            </div>
          </div>
        )}

        {step === 'success' && (
          <div className="text-center space-y-4 py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold">Purchase Request Submitted!</h3>
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
  );
}
