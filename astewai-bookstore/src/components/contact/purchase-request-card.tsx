'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PurchaseRequestStatusBadge, PurchaseRequestStatusDescription } from './purchase-request-status';
import { getItemName, getItemType } from '@/lib/utils/purchase-request-utils';
import type { PurchaseRequest, AdminContactInfo } from '@/types';
import { DollarSign, Calendar } from 'lucide-react';
import { format } from 'date-fns';

interface PurchaseRequestCardProps {
  request: PurchaseRequest;
  contacts: AdminContactInfo[];
  onViewDetails: () => void;
}

export const PurchaseRequestCard = React.memo(function PurchaseRequestCard({ request, contacts, onViewDetails }: PurchaseRequestCardProps) {
  const itemName = getItemName(request);
  const itemType = getItemType(request);

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <h3 className="font-semibold">{itemName}</h3>
              <Badge variant="outline">{itemType}</Badge>
              <PurchaseRequestStatusBadge status={request.status} />
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground mb-3">
              <div className="flex items-center space-x-1">
                <DollarSign className="h-3 w-3" />
                <span>${request.amount}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Calendar className="h-3 w-3" />
                <span>{format(new Date(request.created_at), 'MMM d, yyyy')}</span>
              </div>
            </div>

            <PurchaseRequestStatusDescription status={request.status} className="mb-3" />

            {request.admin_notes && (
              <div className="bg-muted p-2 rounded text-sm">
                <p className="font-medium">Admin Notes:</p>
                <p>{request.admin_notes}</p>
              </div>
            )}
          </div>

          <div className="flex flex-col space-y-2 ml-4">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={onViewDetails}
              aria-label={`View details for ${itemName}`}
            >
              View Details
            </Button>
            
            {request.status === 'contacted' && (
              <Badge variant="secondary" className="text-xs">
                Check your {request.preferred_contact_method || 'messages'}
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
});