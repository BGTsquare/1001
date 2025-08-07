import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { StatusBadge } from './status-badge';
import type { PurchaseRequest } from '@/types';
import { format } from 'date-fns';

interface RequestOverviewProps {
  request: PurchaseRequest;
  itemName: string;
  itemType: string;
}

export function RequestOverview({ request, itemName, itemType }: RequestOverviewProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Request Overview</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-xl font-semibold mb-2">{itemName}</h3>
            <div className="flex items-center space-x-2 mb-3">
              <Badge variant="outline">{itemType}</Badge>
              <StatusBadge status={request.status} />
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-green-600">
              ${request.amount.toFixed(2)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="font-medium text-muted-foreground">Request ID</p>
            <p className="font-mono">{request.id}</p>
          </div>
          <div>
            <p className="font-medium text-muted-foreground">Created</p>
            <p>{format(new Date(request.created_at), 'MMM d, yyyy HH:mm')}</p>
          </div>
          <div>
            <p className="font-medium text-muted-foreground">User ID</p>
            <p className="font-mono">{request.user_id}</p>
          </div>
          <div>
            <p className="font-medium text-muted-foreground">Item Type</p>
            <p className="capitalize">{request.item_type}</p>
          </div>
        </div>

        {request.user_message && (
          <>
            <Separator />
            <div>
              <p className="font-medium text-muted-foreground mb-2">User Message</p>
              <div className="bg-muted p-3 rounded-md">
                <p className="text-sm">{request.user_message}</p>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}