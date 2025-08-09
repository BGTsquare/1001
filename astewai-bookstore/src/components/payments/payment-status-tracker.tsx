'use client';

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Clock, MessageCircle, XCircle, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import type { PurchaseRequest } from '@/types';

interface PaymentStatusTrackerProps {
  request: PurchaseRequest;
  isOpen: boolean;
  onClose: () => void;
}

const statusSteps = [
  { key: 'pending', label: 'Request Submitted', icon: Clock },
  { key: 'contacted', label: 'Under Review', icon: MessageCircle },
  { key: 'approved', label: 'Payment Approved', icon: CheckCircle },
  { key: 'completed', label: 'Purchase Complete', icon: CheckCircle },
];

export function PaymentStatusTracker({ request, isOpen, onClose }: PaymentStatusTrackerProps) {
  const getStatusIndex = (status: string) => {
    const index = statusSteps.findIndex(step => step.key === status);
    return index === -1 ? 0 : index;
  };

  const currentStatusIndex = getStatusIndex(request.status);
  const isRejected = request.status === 'rejected';
  const isCancelled = request.status === 'cancelled';

  const getStepStatus = (stepIndex: number) => {
    if (isRejected || isCancelled) {
      return stepIndex === 0 ? 'completed' : 'pending';
    }
    if (stepIndex <= currentStatusIndex) return 'completed';
    if (stepIndex === currentStatusIndex + 1) return 'current';
    return 'pending';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Payment Request Status</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Item Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <span>{request.book ? 'Book' : 'Bundle'} Details</span>
                <Badge variant={request.book ? 'default' : 'secondary'}>
                  {request.book ? 'Book' : 'Bundle'}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start space-x-4">
                <div className="flex-1">
                  <h3 className="font-medium">{request.book?.title || request.bundle?.title}</h3>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge variant="outline">{request.book ? 'Book' : 'Bundle'}</Badge>
                    <span className="text-sm text-muted-foreground">
                      Request #{request.id.slice(-8)}
                    </span>
                  </div>
                  {request.book?.author && (
                    <p className="text-sm text-muted-foreground">by {request.book.author}</p>
                  )}
                  {(request.book?.description || request.bundle?.description) && (
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-3">
                      {request.book?.description || request.bundle?.description}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Status Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Status Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {statusSteps.map((step, index) => {
                  const StepIcon = step.icon;
                  const stepStatus = getStepStatus(index);
                  
                  return (
                    <div key={step.key} className="flex items-center space-x-3">
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                        stepStatus === 'completed' 
                          ? 'bg-green-100 text-green-600' 
                          : stepStatus === 'current'
                          ? 'bg-blue-100 text-blue-600'
                          : 'bg-gray-100 text-gray-400'
                      }`}>
                        <StepIcon className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm font-medium ${
                          stepStatus === 'completed' || stepStatus === 'current'
                            ? 'text-gray-900' 
                            : 'text-gray-500'
                        }`}>
                          {step.label}
                        </p>
                        {stepStatus === 'completed' && (
                          <p className="text-xs text-gray-500">
                            {format(new Date(request.updated_at || request.created_at), 'MMM d, yyyy h:mm a')}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
                
                {/* Show rejection/cancellation status */}
                {(isRejected || isCancelled) && (
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-red-100 text-red-600">
                      <XCircle className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        Request {isRejected ? 'Rejected' : 'Cancelled'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {format(new Date(request.updated_at || request.created_at), 'MMM d, yyyy h:mm a')}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Request Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Request Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-700">Contact Method</p>
                <p className="text-sm text-gray-600 capitalize">{request.contact_method}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-700">Contact Info</p>
                <p className="text-sm text-gray-600">{request.contact_info}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-700">Request Date</p>
                <p className="text-sm text-gray-600">
                  {format(new Date(request.created_at), 'MMMM d, yyyy h:mm a')}
                </p>
              </div>
              
              {request.admin_notes && (
                <div>
                  <p className="text-sm font-medium text-gray-700">Admin Notes</p>
                  <p className="text-sm text-gray-600">{request.admin_notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* User Message */}
          {request.user_message && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Your Message</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{request.user_message}</p>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2">
            {request.status === 'completed' && (
              <Button onClick={() => {
                // Navigate to library or download
                window.open(`/library`, '_blank');
              }}>
                <ExternalLink className="h-4 w-4 mr-2" />
                Access Purchase
              </Button>
            )}
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}