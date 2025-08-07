'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type { PurchaseRequest } from '@/types';
import { 
  CheckCircle, 
  XCircle, 
  DollarSign,
  Book,
  Package,
  Loader2,
  AlertTriangle
} from 'lucide-react';
import { validateBulkApproval } from '@/lib/utils/payment-approval-utils';

interface BulkApprovalDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedRequests: string[];
  requests: PurchaseRequest[];
  onBulkAction: (action: 'approve' | 'reject', notes?: string) => void;
  isProcessing: boolean;
}

export function BulkApprovalDialog({
  isOpen,
  onClose,
  selectedRequests,
  requests,
  onBulkAction,
  isProcessing
}: BulkApprovalDialogProps) {
  const [action, setAction] = useState<'approve' | 'reject' | null>(null);
  const [notes, setNotes] = useState('');

  const totalValue = requests.reduce((sum, request) => sum + request.amount, 0);
  const bookCount = requests.filter(r => r.item_type === 'book').length;
  const bundleCount = requests.filter(r => r.item_type === 'bundle').length;
  
  // Validate bulk approval
  const validation = validateBulkApproval(requests, totalValue);

  const handleAction = (selectedAction: 'approve' | 'reject') => {
    setAction(selectedAction);
  };

  const handleConfirm = () => {
    if (action) {
      onBulkAction(action, notes);
    }
  };

  const handleCancel = () => {
    setAction(null);
    setNotes('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleCancel}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            Bulk Payment {action ? (action === 'approve' ? 'Approval' : 'Rejection') : 'Actions'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Selection Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium text-muted-foreground">Total Requests</p>
                  <p className="text-2xl font-bold">{selectedRequests.length}</p>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground">Total Value</p>
                  <p className="text-2xl font-bold text-green-600">
                    ${totalValue.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground">Books</p>
                  <div className="flex items-center space-x-1">
                    <Book className="h-4 w-4" />
                    <span className="font-semibold">{bookCount}</span>
                  </div>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground">Bundles</p>
                  <div className="flex items-center space-x-1">
                    <Package className="h-4 w-4" />
                    <span className="font-semibold">{bundleCount}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Request List */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Selected Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-60 overflow-y-auto space-y-2">
                {requests.map((request, index) => {
                  const itemName = request.book?.title || request.bundle?.title || 'Unknown Item';
                  const ItemIcon = request.item_type === 'book' ? Book : Package;
                  
                  return (
                    <div key={request.id} className="flex items-center justify-between p-2 bg-muted rounded">
                      <div className="flex items-center space-x-2 flex-1 min-w-0">
                        <ItemIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span className="text-sm font-medium truncate">{itemName}</span>
                        <Badge variant="outline" className="text-xs">
                          {request.item_type}
                        </Badge>
                      </div>
                      <span className="text-sm font-semibold text-green-600">
                        ${request.amount.toFixed(2)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {!action && (
            <>
              <Separator />
              
              {/* Action Selection */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Choose Action</h3>
                <div className="grid grid-cols-2 gap-4">
                  <Button
                    size="lg"
                    onClick={() => handleAction('approve')}
                    className="h-20 flex-col space-y-2"
                    disabled={isProcessing}
                  >
                    <CheckCircle className="h-6 w-6" />
                    <span>Approve All</span>
                    <span className="text-xs opacity-75">
                      ${totalValue.toFixed(2)} total
                    </span>
                  </Button>
                  
                  <Button
                    size="lg"
                    variant="destructive"
                    onClick={() => handleAction('reject')}
                    className="h-20 flex-col space-y-2"
                    disabled={isProcessing}
                  >
                    <XCircle className="h-6 w-6" />
                    <span>Reject All</span>
                    <span className="text-xs opacity-75">
                      {selectedRequests.length} requests
                    </span>
                  </Button>
                </div>
              </div>
            </>
          )}

          {action && (
            <>
              <Separator />
              
              {/* Confirmation */}
              <div className="space-y-4">
                <div className={`p-4 rounded-lg border ${
                  action === 'approve' 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-red-50 border-red-200'
                }`}>
                  <div className="flex items-center space-x-2 mb-2">
                    {action === 'approve' ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )}
                    <h3 className="font-semibold">
                      {action === 'approve' ? 'Approve' : 'Reject'} {selectedRequests.length} Requests
                    </h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {action === 'approve' 
                      ? `You are about to approve ${selectedRequests.length} payment requests with a total value of $${totalValue.toFixed(2)}. Users will be notified of the approval.`
                      : `You are about to reject ${selectedRequests.length} payment requests. Users will be notified of the rejection.`
                    }
                  </p>
                </div>

                {/* Notes */}
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    {action === 'approve' ? 'Approval Notes (Optional)' : 'Rejection Reason (Optional)'}
                  </label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder={
                      action === 'approve' 
                        ? 'Add any notes about this approval...'
                        : 'Explain why these requests are being rejected...'
                    }
                    rows={3}
                    className="mt-1"
                  />
                </div>

                {/* Validation Warnings */}
                {action === 'approve' && validation.warnings.length > 0 && (
                  <div className="space-y-2">
                    {validation.warnings.map((warning, index) => (
                      <div 
                        key={index}
                        className={`flex items-start space-x-2 p-3 rounded border ${
                          warning.severity === 'error' 
                            ? 'bg-red-50 border-red-200' 
                            : warning.severity === 'warning'
                            ? 'bg-yellow-50 border-yellow-200'
                            : 'bg-blue-50 border-blue-200'
                        }`}
                      >
                        <AlertTriangle className={`h-5 w-5 flex-shrink-0 mt-0.5 ${
                          warning.severity === 'error' 
                            ? 'text-red-600' 
                            : warning.severity === 'warning'
                            ? 'text-yellow-600'
                            : 'text-blue-600'
                        }`} />
                        <div>
                          <p className={`text-sm font-medium ${
                            warning.severity === 'error' 
                              ? 'text-red-800' 
                              : warning.severity === 'warning'
                              ? 'text-yellow-800'
                              : 'text-blue-800'
                          }`}>
                            {warning.type === 'high_value' && 'High Value Approval'}
                            {warning.type === 'very_high_value' && 'Very High Value Approval'}
                            {warning.type === 'large_batch' && 'Large Batch Size'}
                            {warning.type === 'mixed_types' && 'Mixed Item Types'}
                            {warning.type === 'old_requests' && 'Old Requests'}
                          </p>
                          <p className={`text-xs ${
                            warning.severity === 'error' 
                              ? 'text-red-700' 
                              : warning.severity === 'warning'
                              ? 'text-yellow-700'
                              : 'text-blue-700'
                          }`}>
                            {warning.message}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center justify-end space-x-3">
                  <Button
                    variant="outline"
                    onClick={() => setAction(null)}
                    disabled={isProcessing}
                  >
                    Back
                  </Button>
                  <Button
                    variant={action === 'approve' ? 'default' : 'destructive'}
                    onClick={handleConfirm}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Processing...
                      </>
                    ) : (
                      <>
                        {action === 'approve' ? (
                          <CheckCircle className="h-4 w-4 mr-2" />
                        ) : (
                          <XCircle className="h-4 w-4 mr-2" />
                        )}
                        Confirm {action === 'approve' ? 'Approval' : 'Rejection'}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}