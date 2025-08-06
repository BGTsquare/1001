'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ContactButton } from './contact-display';
import { generateContactUrl, contactMethodDisplayNames } from '@/lib/validation/contact-validation';
import type { PurchaseRequest, AdminContactInfo } from '@/types';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  MessageCircle, 
  ExternalLink, 
  Loader2,
  DollarSign,
  Calendar,
  Package,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';

export function UserPurchaseRequests() {
  const [selectedRequest, setSelectedRequest] = useState<PurchaseRequest | null>(null);

  // Fetch user's purchase requests
  const { data: requests = [], isLoading, error } = useQuery({
    queryKey: ['purchase-requests', 'user'],
    queryFn: async () => {
      const response = await fetch('/api/purchase-requests');
      if (!response.ok) {
        throw new Error('Failed to fetch purchase requests');
      }
      const result = await response.json();
      return result.data as PurchaseRequest[];
    }
  });

  // Fetch admin contacts for generating contact URLs
  const { data: contacts = [] } = useQuery({
    queryKey: ['admin-contacts'],
    queryFn: async () => {
      const response = await fetch('/api/contact');
      if (!response.ok) {
        throw new Error('Failed to fetch admin contacts');
      }
      const result = await response.json();
      return result.data as AdminContactInfo[];
    }
  });

  const getStatusBadge = (status: PurchaseRequest['status']) => {
    const variants = {
      pending: { variant: 'secondary' as const, icon: Clock, label: 'Pending Review', color: 'text-orange-600' },
      contacted: { variant: 'default' as const, icon: MessageCircle, label: 'Admin Contacted', color: 'text-blue-600' },
      approved: { variant: 'default' as const, icon: CheckCircle, label: 'Approved', color: 'text-green-600' },
      rejected: { variant: 'destructive' as const, icon: XCircle, label: 'Rejected', color: 'text-red-600' },
      completed: { variant: 'default' as const, icon: CheckCircle, label: 'Completed', color: 'text-green-600' },
    };

    const config = variants[status];
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center space-x-1">
        <Icon className={`h-3 w-3 ${config.color}`} />
        <span>{config.label}</span>
      </Badge>
    );
  };

  const getStatusDescription = (status: PurchaseRequest['status']) => {
    const descriptions = {
      pending: 'Your request is waiting for admin review. You will be contacted soon.',
      contacted: 'An admin has reached out to you. Please check your preferred contact method.',
      approved: 'Your request has been approved! Please complete the payment process.',
      rejected: 'Your request was not approved. Contact admin for more information.',
      completed: 'Your purchase is complete! The item should be available in your library.',
    };

    return descriptions[status];
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="ml-2">Loading your purchase requests...</span>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <AlertCircle className="h-6 w-6 text-destructive" />
          <span className="ml-2">Failed to load purchase requests</span>
        </CardContent>
      </Card>
    );
  }

  if (requests.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Purchase Requests</h3>
          <p className="text-muted-foreground">
            You haven't made any purchase requests yet. Browse our books and bundles to get started!
          </p>
        </CardContent>
      </Card>
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

interface PurchaseRequestCardProps {
  request: PurchaseRequest;
  contacts: AdminContactInfo[];
  onViewDetails: () => void;
}

function PurchaseRequestCard({ request, contacts, onViewDetails }: PurchaseRequestCardProps) {
  const itemName = request.book?.title || request.bundle?.title || 'Unknown Item';
  const itemType = request.item_type === 'book' ? 'Book' : 'Bundle';

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <h3 className="font-semibold">{itemName}</h3>
              <Badge variant="outline">{itemType}</Badge>
              {getStatusBadge(request.status)}
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

            <p className="text-sm text-muted-foreground mb-3">
              {getStatusDescription(request.status)}
            </p>

            {request.admin_notes && (
              <div className="bg-muted p-2 rounded text-sm">
                <p className="font-medium">Admin Notes:</p>
                <p>{request.admin_notes}</p>
              </div>
            )}
          </div>

          <div className="flex flex-col space-y-2 ml-4">
            <Button size="sm" variant="outline" onClick={onViewDetails}>
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
}

interface PurchaseRequestDetailsProps {
  request: PurchaseRequest;
  contacts: AdminContactInfo[];
}

function PurchaseRequestDetails({ request, contacts }: PurchaseRequestDetailsProps) {
  const itemName = request.book?.title || request.bundle?.title || 'Unknown Item';
  const itemType = request.item_type === 'book' ? 'Book' : 'Bundle';

  const preferredContact = request.preferred_contact_method
    ? contacts.find(c => c.contact_type === request.preferred_contact_method && c.is_primary)
    : contacts.find(c => c.is_primary);

  return (
    <div className="space-y-4">
      {/* Item Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Item Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-start space-x-4">
            {(request.book?.cover_image_url || request.bundle?.cover_image_url) && (
              <img
                src={request.book?.cover_image_url || request.bundle?.cover_image_url}
                alt={itemName}
                className="w-16 h-20 object-cover rounded"
              />
            )}
            <div className="flex-1">
              <h3 className="font-semibold">{itemName}</h3>
              {'author' in (request.book || {}) && (
                <p className="text-sm text-muted-foreground">by {request.book?.author}</p>
              )}
              <div className="flex items-center space-x-2 mt-2">
                <Badge variant="secondary">{itemType}</Badge>
                <span className="font-semibold text-lg">${request.amount}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Request Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Request Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span>Current Status:</span>
              {getStatusBadge(request.status)}
            </div>
            
            <p className="text-sm text-muted-foreground">
              {getStatusDescription(request.status)}
            </p>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium">Created</p>
                <p className="text-muted-foreground">
                  {format(new Date(request.created_at), 'MMM d, yyyy HH:mm')}
                </p>
              </div>
              
              {request.contacted_at && (
                <div>
                  <p className="font-medium">Contacted</p>
                  <p className="text-muted-foreground">
                    {format(new Date(request.contacted_at), 'MMM d, yyyy HH:mm')}
                  </p>
                </div>
              )}
              
              {request.responded_at && (
                <div>
                  <p className="font-medium">Responded</p>
                  <p className="text-muted-foreground">
                    {format(new Date(request.responded_at), 'MMM d, yyyy HH:mm')}
                  </p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Your Message */}
      {request.user_message && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Your Message</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{request.user_message}</p>
          </CardContent>
        </Card>
      )}

      {/* Admin Notes */}
      {request.admin_notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Admin Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{request.admin_notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Contact Information */}
      {request.preferred_contact_method && preferredContact && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Contact Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">
                  Preferred Method: {contactMethodDisplayNames[request.preferred_contact_method]}
                </p>
                <p className="text-sm text-muted-foreground">
                  Admin will contact you via {request.preferred_contact_method}
                </p>
              </div>
              
              {request.status === 'contacted' && (
                <Button
                  onClick={() => {
                    const url = generateContactUrl(
                      preferredContact.contact_type,
                      preferredContact.contact_value
                    );
                    window.open(url, '_blank');
                  }}
                >
                  Open {contactMethodDisplayNames[preferredContact.contact_type]}
                  <ExternalLink className="ml-1 h-3 w-3" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}