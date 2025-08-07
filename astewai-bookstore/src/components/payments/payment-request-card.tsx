'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DollarSign, Calendar, Book, Package, Eye, Download, X } from 'lucide-react';
import { format } from 'date-fns';
import type { PurchaseRequest } from '@/types';
import { getStatusBadge, canCancelRequest, canDownloadReceipt, getItemDisplayInfo } from '@/lib/utils/payment-utils';

interface PaymentRequestCardProps {
  request: PurchaseRequest;
  onViewDetails: () => void;
  onDownloadReceipt: () => void;
  onCancel: () => void;
}

export function PaymentRequestCard({ 
  request, 
  onViewDetails, 
  onDownloadReceipt, 
  onCancel 
}: PaymentRequestCardProps) {
  const { itemName, itemType, coverImage } = getItemDisplayInfo(request);
  const statusConfig = getStatusBadge(request.status);
  const StatusIcon = statusConfig.icon;
  const ItemIcon = request.item_type === 'book' ? Book : Package;

  return (
    <Card className="transition-all hover:shadow-md">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4 flex-1">
            {coverImage && (
              <img
                src={coverImage}
                alt={itemName}
                className="w-12 h-16 object-cover rounded"
              />
            )}
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-2">
                <ItemIcon className="h-4 w-4 text-muted-foreground" />
                <h3 className="font-semibold truncate">{itemName}</h3>
                <Badge variant="outline" className="text-xs">
                  {itemType}
                </Badge>
                <Badge variant={statusConfig.variant} className="flex items-center space-x-1">
                  <StatusIcon className={`h-3 w-3 ${statusConfig.color}`} />
                  <span>{statusConfig.label}</span>
                </Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground mb-3">
                <div className="flex items-center space-x-1">
                  <DollarSign className="h-3 w-3" />
                  <span className="font-medium">${request.amount.toFixed(2)}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Calendar className="h-3 w-3" />
                  <span>{format(new Date(request.created_at), 'MMM d, yyyy')}</span>
                </div>
              </div>

              {request.user_message && (
                <div className="bg-muted p-2 rounded text-sm mb-3">
                  <p className="text-muted-foreground line-clamp-2">
                    {request.user_message}
                  </p>
                </div>
              )}

              {request.admin_notes && (
                <div className="bg-blue-50 p-2 rounded text-sm mb-3">
                  <p className="text-blue-800 font-medium">Admin Notes:</p>
                  <p className="text-blue-700">{request.admin_notes}</p>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex flex-col space-y-2 ml-4">
            <Button
              size="sm"
              variant="outline"
              onClick={onViewDetails}
            >
              <Eye className="h-3 w-3 mr-1" />
              View Details
            </Button>
            
            {canDownloadReceipt(request) && (
              <Button
                size="sm"
                variant="outline"
                onClick={onDownloadReceipt}
              >
                <Download className="h-3 w-3 mr-1" />
                Receipt
              </Button>
            )}
            
            {canCancelRequest(request) && (
              <Button
                size="sm"
                variant="destructive"
                onClick={onCancel}
              >
                <X className="h-3 w-3 mr-1" />
                Cancel
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}