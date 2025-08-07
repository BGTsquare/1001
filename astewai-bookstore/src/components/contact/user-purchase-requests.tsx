'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { LoadingState, ErrorState, EmptyState } from '@/components/ui/data-states';
import { PurchaseRequestCard } from './purchase-request-card';
import { PurchaseRequestDetails } from './purchase-request-details';
import { usePurchaseRequests, useAdminContacts } from '@/hooks/use-purchase-requests';
import type { PurchaseRequest } from '@/types';

export function UserPurchaseRequests() {
  const [selectedRequest, setSelectedRequest] = useState<PurchaseRequest | null>(null);

  const { data: requests = [], isLoading, error } = usePurchaseRequests();
  const { data: contacts = [] } = useAdminContacts();

  if (isLoading) {
    return <LoadingState message="Loading your purchase requests..." />;
  }

  if (error) {
    return <ErrorState message="Failed to load purchase requests" />;
  }

  if (requests.length === 0) {
    return (
      <EmptyState
        title="No Purchase Requests"
        description="You haven't made any purchase requests yet. Browse our books and bundles to get started!"
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Your Purchase Requests</h2>
        <p className="text-muted-foreground">Track the status of your purchase requests</p>
      </div>

      <div className="grid gap-4">
        {requests.map((request) => (
          <PurchaseRequestCard
            key={request.id}
            request={request}
            contacts={contacts}
            onViewDetails={() => setSelectedRequest(request)}
          />
        ))}
      </div>

      {/* Request Details Modal */}
      {selectedRequest && (
        <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Purchase Request Details</DialogTitle>
            </DialogHeader>
            
            <PurchaseRequestDetails 
              request={selectedRequest} 
              contacts={contacts}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}