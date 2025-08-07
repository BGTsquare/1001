'use client';

import React, { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { RequestOverview } from './request-overview';
import { ItemDetails } from './item-details';
import { AdminNotes } from './admin-notes';
import { ContactSidebar } from './contact-sidebar';
import { ActionsSidebar } from './actions-sidebar';
import { TimelineSidebar } from './timeline-sidebar';
import { usePaymentRequestMutation } from '@/hooks/use-payment-request-mutation';
import { useAdminContacts } from '@/hooks/use-admin-contacts';
import type { PurchaseRequest } from '@/types';
import { Book, Package } from 'lucide-react';

interface PaymentRequestDetailsProps {
  request: PurchaseRequest;
  isOpen: boolean;
  onClose: () => void;
  onStatusUpdate: () => void;
}

export function PaymentRequestDetails({ 
  request, 
  isOpen, 
  onClose, 
  onStatusUpdate 
}: PaymentRequestDetailsProps) {
  const [adminNotes, setAdminNotes] = useState(request.admin_notes || '');
  
  const { data: contacts = [] } = useAdminContacts();
  const updateStatusMutation = usePaymentRequestMutation(request.id, onStatusUpdate);

  const itemName = request.book?.title || request.bundle?.title || 'Unknown Item';
  const itemType = request.item_type === 'book' ? 'Book' : 'Bundle';
  const ItemIcon = request.item_type === 'book' ? Book : Package;

  const preferredContact = request.preferred_contact_method
    ? contacts.find(c => c.contact_type === request.preferred_contact_method && c.is_primary)
    : contacts.find(c => c.is_primary);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <ItemIcon className="h-5 w-5" />
            <span>Payment Request Details</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <RequestOverview request={request} itemName={itemName} itemType={itemType} />
            <ItemDetails request={request} />
            <AdminNotes 
              adminNotes={adminNotes} 
              onNotesChange={setAdminNotes} 
            />
          </div>

          <div className="space-y-6">
            {preferredContact && (
              <ContactSidebar 
                contact={preferredContact}
                request={request}
                onContact={() => {
                  if (request.status === 'pending') {
                    updateStatusMutation.mutate({ status: 'contacted', notes: adminNotes });
                  }
                }}
              />
            )}
            
            <ActionsSidebar 
              request={request}
              adminNotes={adminNotes}
              updateStatusMutation={updateStatusMutation}
            />
            
            <TimelineSidebar request={request} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}