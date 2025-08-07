import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getAvailableActions } from '@/lib/utils/payment-request-utils';
import type { PurchaseRequest } from '@/types';
import type { UseMutationResult } from '@tanstack/react-query';
import { 
  CheckCircle, 
  XCircle, 
  MessageCircle,
  Loader2
} from 'lucide-react';

interface ActionsSidebarProps {
  request: PurchaseRequest;
  adminNotes: string;
  updateStatusMutation: UseMutationResult<any, Error, { status: string; notes?: string }>;
}

export function ActionsSidebar({ 
  request, 
  adminNotes, 
  updateStatusMutation 
}: ActionsSidebarProps) {
  const actions = useMemo(() => getAvailableActions(request.status), [request.status]);
  const isLoading = updateStatusMutation.isPending;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {actions.canMarkContacted && (
          <Button
            className="w-full"
            variant="outline"
            onClick={() => updateStatusMutation.mutate({ status: 'contacted', notes: adminNotes })}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <MessageCircle className="h-4 w-4 mr-2" />
            )}
            Mark as Contacted
          </Button>
        )}
        
        {actions.canApprove && (
          <Button
            className="w-full"
            onClick={() => updateStatusMutation.mutate({ status: 'approved', notes: adminNotes })}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <CheckCircle className="h-4 w-4 mr-2" />
            )}
            Approve Request
          </Button>
        )}
        
        {actions.canReject && (
          <Button
            className="w-full"
            variant="destructive"
            onClick={() => updateStatusMutation.mutate({ status: 'rejected', notes: adminNotes })}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <XCircle className="h-4 w-4 mr-2" />
            )}
            Reject Request
          </Button>
        )}
        
        {actions.canComplete && (
          <Button
            className="w-full"
            onClick={() => updateStatusMutation.mutate({ status: 'completed', notes: adminNotes })}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <CheckCircle className="h-4 w-4 mr-2" />
            )}
            Mark as Completed
          </Button>
        )}
      </CardContent>
    </Card>
  );
}