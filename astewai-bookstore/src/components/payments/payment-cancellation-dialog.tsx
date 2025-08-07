'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { AlertTriangle, Loader2 } from 'lucide-react';
import type { PurchaseRequest } from '@/types';

interface PaymentCancellationDialogProps {
  request: PurchaseRequest;
  isOpen: boolean;
  onClose: () => void;
  onCancel: (reason: string) => void;
  isProcessing: boolean;
}

export function PaymentCancellationDialog({ 
  request, 
  isOpen, 
  onClose, 
  onCancel, 
  isProcessing 
}: PaymentCancellationDialogProps) {
  const [reason, setReason] = useState('');

  const handleCancel = () => {
    if (reason.trim()) {
      onCancel(reason.trim());
    }
  };

  const handleClose = () => {
    if (!isProcessing) {
      setReason('');
      onClose();
    }
  };

  const itemName = request.book?.title || request.bundle?.title || 'Unknown Item';

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            <span>Cancel Payment Request</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-4 bg-orange-50 rounded-lg">
            <p className="text-sm text-orange-800">
              You are about to cancel your payment request for:
            </p>
            <p className="font-medium text-orange-900 mt-1">
              {itemName} (${request.amount.toFixed(2)})
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cancellation-reason">
              Reason for cancellation (optional)
            </Label>
            <Textarea
              id="cancellation-reason"
              placeholder="Please provide a reason for cancelling this request..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={isProcessing}
              rows={3}
            />
          </div>

          <div className="text-sm text-muted-foreground">
            <p>
              Once cancelled, this request cannot be restored. You will need to 
              create a new payment request if you wish to purchase this item.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={handleClose}
            disabled={isProcessing}
          >
            Keep Request
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleCancel}
            disabled={isProcessing || !reason.trim()}
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Cancelling...
              </>
            ) : (
              'Cancel Request'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}