'use client';

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, Clock, MessageCircle, XCircle, X } from 'lucide-react';
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
          {/* Request Details */}
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Request ID:</span>
                  <p className="text-muted-foreground">{request.id}</p>
                </div>
                <div>
                  <span className="font-medium">Amount:</span>
                  <p className="text-muted-foreground">${request.amount.toFixed(2)}</p>
                </div>
                <div>
                  <span className="font-medium">Item:</span>
                  <p className="text-muted-foreground">
                    {request.book?.title || request.bundle?.title || 'Unknown Item'}
                  </p>
                </div>
                <div>
                  <span className="font-medium">Created:</span>
                  <p className="text-muted-foreground">
                    {format(new Date(request.created_at), 'MMM d, yyyy HH:mm')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Status Timeline */}
          <div className="space-y-4">
            <h3 className="font-semibold">Status Timeline</h3>
            
            {(isRejected || isCancelled) ? (
              <div className="flex items-center space-x-3 p-3 bg-red-50 rounded-lg">
                <XCircle className="h-5 w-5 text-red-600" />
                <div>
                  <p className="font-medium text-red-800">
                    Request {isRejected ? 'Rejected' : 'Cancelled'}
                  </p>
                  <p className="text-sm text-red-600">
                    {format(new Date(request.updated_at), 'MMM d, yyyy HH:mm')}
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {statusSteps.map((step, index) => {
                  const status = getStepStatus(index);
                  const Icon = step.icon;
                  
                  return (
                    <div key={step.key} className="flex items-center space-x-3">
                      <div className={`
                        flex items-center justify-center w-8 h-8 rounded-full border-2
                        ${status === 'completed' 
                          ? 'bg-green-100 border-green-500 text-green-600' 
                          : status === 'current'
                          ? 'bg-blue-100 border-blue-500 text-blue-600'
                          : 'bg-gray-100 border-gray-300 text-gray-400'
                        }
                      `}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <p className={`font-medium ${
                          status === 'completed' ? 'text-green-800' :
                          status === 'current' ? 'text-blue-800' :
                          'text-gray-500'
                        }`}>
                          {step.label}
                        </p>
                        {status === 'completed' && index === currentStatusIndex && (
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(request.updated_at), 'MMM d, yyyy HH:mm')}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Admin Notes */}
          {request.admin_notes && (
            <Card>
              <CardContent className="p-4">
                <h4 className="font-medium mb-2">Admin Notes</h4>
                <p className="text-sm text-muted-foreground">{request.admin_notes}</p>
              </CardContent>
            </Card>
          )}

          {/* User Message */}
          {request.user_message && (
            <Card>
              <CardContent className="p-4">
                <h4 className="font-medium mb-2">Your Message</h4>
                <p className="text-sm text-muted-foreground">{request.user_message}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}emType}</Badge>
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

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Status Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {timelineSteps.map((step, index) => (
                  <div key={step.id} className="flex items-start space-x-4">
                    <div className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        step.completed 
                          ? 'bg-green-100 text-green-600' 
                          : 'bg-gray-100 text-gray-400'
                      }`}>
                        {step.completed ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          <div className="w-2 h-2 bg-current rounded-full" />
                        )}
                      </div>
                      {index < timelineSteps.length - 1 && (
                        <div className={`w-0.5 h-8 mt-2 ${
                          step.completed ? 'bg-green-200' : 'bg-gray-200'
                        }`} />
                      )}
                    </div>
                    <div className="flex-1 pb-4">
                      <div className="flex items-center justify-between">
                        <h4 className={`font-medium ${
                          step.completed ? 'text-foreground' : 'text-muted-foreground'
                        }`}>
                          {step.label}
                        </h4>
                        {step.timestamp && (
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(step.timestamp), 'MMM d, HH:mm')}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {step.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Request Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Request Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium text-muted-foreground">Request ID</p>
                  <p className="font-mono">{request.id}</p>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground">Amount</p>
                  <p className="font-semibold">${request.amount.toFixed(2)}</p>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground">Created</p>
                  <p>{format(new Date(request.created_at), 'MMM d, yyyy HH:mm')}</p>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground">Last Updated</p>
                  <p>{formatDistanceToNow(new Date(request.updated_at || request.created_at))} ago</p>
                </div>
              </div>

              {request.user_message && (
                <>
                  <Separator />
                  <div>
                    <p className="font-medium text-muted-foreground mb-2">Your Message</p>
                    <div className="bg-muted p-3 rounded-md">
                      <p className="text-sm">{request.user_message}</p>
                    </div>
                  </div>
                </>
              )}

              {request.admin_notes && (
                <>
                  <Separator />
                  <div>
                    <p className="font-medium text-muted-foreground mb-2">Admin Notes</p>
                    <div className="bg-blue-50 p-3 rounded-md">
                      <p className="text-sm text-blue-800">{request.admin_notes}</p>
                    </div>
                  </div>
                </>
              )}

              {request.preferred_contact_method && (
                <>
                  <Separator />
                  <div>
                    <p className="font-medium text-muted-foreground mb-1">Preferred Contact</p>
                    <p className="text-sm capitalize">{request.preferred_contact_method}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Real-time Status */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Bell className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-muted-foreground">
                    Real-time updates enabled
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  Last updated: {format(lastUpdate, 'HH:mm:ss')}
                </span>
              </div>
            </CardContent>
          </Card>

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