'use client';

import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  User,
  DollarSign,
  Calendar
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export function PurchaseRequestManager() {
  const [selectedRequest, setSelectedRequest] = useState<PurchaseRequest | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const queryClient = useQueryClient();

  // Fetch purchase requests
  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['purchase-requests', 'admin'],
    queryFn: async () => {
      const response = await fetch('/api/purchase-requests?admin=true');
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

  // Update request status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: string; notes?: string }) => {
      const response = await fetch(`/api/purchase-requests/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status, adminNotes: notes }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update request status');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-requests'] });
      toast.success('Request status updated successfully!');
      setSelectedRequest(null);
      setAdminNotes('');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update request status');
    }
  });

  const getStatusBadge = (status: PurchaseRequest['status']) => {
    const variants = {
      pending: { variant: 'secondary' as const, icon: Clock, label: 'Pending' },
      contacted: { variant: 'default' as const, icon: MessageCircle, label: 'Contacted' },
      approved: { variant: 'default' as const, icon: CheckCircle, label: 'Approved' },
      rejected: { variant: 'destructive' as const, icon: XCircle, label: 'Rejected' },
      completed: { variant: 'default' as const, icon: CheckCircle, label: 'Completed' },
    };

    const config = variants[status];
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center space-x-1">
        <Icon className="h-3 w-3" />
        <span>{config.label}</span>
      </Badge>
    );
  };

  const generateContactMessage = (request: PurchaseRequest) => {
    const itemName = request.book?.title || request.bundle?.title || 'Unknown Item';
    const itemType = request.item_type === 'book' ? 'Book' : 'Bundle';
    
    let message = `Hi! Regarding your purchase request for the ${itemType.toLowerCase()}: "${itemName}" ($${request.amount}).`;
    
    if (request.user_message) {
      message += `\n\nYour message: ${request.user_message}`;
    }
    
    message += `\n\nRequest ID: ${request.id}`;
    
    return message;
  };

  const filteredRequests = {
    pending: requests.filter(r => r.status === 'pending'),
    contacted: requests.filter(r => r.status === 'contacted'),
    approved: requests.filter(r => r.status === 'approved'),
    completed: requests.filter(r => r.status === 'completed'),
    rejected: requests.filter(r => r.status === 'rejected'),
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="ml-2">Loading purchase requests...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Purchase Requests</h2>
        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
          <span>Total: {requests.length}</span>
          <span>Pending: {filteredRequests.pending.length}</span>
        </div>
      </div>

      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending">
            Pending ({filteredRequests.pending.length})
          </TabsTrigger>
          <TabsTrigger value="contacted">
            Contacted ({filteredRequests.contacted.length})
          </TabsTrigger>
          <TabsTrigger value="approved">
            Approved ({filteredRequests.approved.length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed ({filteredRequests.completed.length})
          </TabsTrigger>
          <TabsTrigger value="rejected">
            Rejected ({filteredRequests.rejected.length})
          </TabsTrigger>
        </TabsList>

        {Object.entries(filteredRequests).map(([status, statusRequests]) => (
          <TabsContent key={status} value={status}>
            {statusRequests.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-muted-foreground">
                    No {status} requests found.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {statusRequests.map((request) => (
                  <PurchaseRequestCard
                    key={request.id}
                    request={request}
                    contacts={contacts}
                    onStatusUpdate={(status, notes) =>
                      updateStatusMutation.mutate({ id: request.id, status, notes })
                    }
                    isUpdating={updateStatusMutation.isPending}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

interface PurchaseRequestCardProps {
  request: PurchaseRequest;
  contacts: AdminContactInfo[];
  onStatusUpdate: (status: string, notes?: string) => void;
  isUpdating: boolean;
}

function PurchaseRequestCard({ 
  request, 
  contacts, 
  onStatusUpdate, 
  isUpdating 
}: PurchaseRequestCardProps) {
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [adminNotes, setAdminNotes] = useState(request.admin_notes || '');

  const itemName = request.book?.title || request.bundle?.title || 'Unknown Item';
  const itemType = request.item_type === 'book' ? 'Book' : 'Bundle';

  const preferredContact = request.preferred_contact_method
    ? contacts.find(c => c.contact_type === request.preferred_contact_method && c.is_primary)
    : contacts.find(c => c.is_primary);

  const contactMessage = generateContactMessage(request);

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

            {request.user_message && (
              <div className="bg-muted p-2 rounded text-sm mb-3">
                <p className="font-medium">User Message:</p>
                <p>{request.user_message}</p>
              </div>
            )}

            {request.preferred_contact_method && (
              <p className="text-sm text-muted-foreground mb-3">
                Preferred contact: {contactMethodDisplayNames[request.preferred_contact_method]}
              </p>
            )}
          </div>

          <div className="flex flex-col space-y-2 ml-4">
            <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  Manage
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Manage Purchase Request</DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4">
                  {/* Request Details */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Request Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium">Item</p>
                          <p className="text-sm text-muted-foreground">{itemName}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Amount</p>
                          <p className="text-sm text-muted-foreground">${request.amount}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Status</p>
                          {getStatusBadge(request.status)}
                        </div>
                        <div>
                          <p className="text-sm font-medium">Created</p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(request.created_at), 'MMM d, yyyy HH:mm')}
                          </p>
                        </div>
                      </div>
                      
                      {request.user_message && (
                        <div>
                          <p className="text-sm font-medium">User Message</p>
                          <p className="text-sm text-muted-foreground">{request.user_message}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Contact Actions */}
                  {preferredContact && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Contact User</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">
                              {contactMethodDisplayNames[preferredContact.contact_type]}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {preferredContact.display_name || preferredContact.contact_value}
                            </p>
                          </div>
                          <Button
                            onClick={() => {
                              const url = generateContactUrl(
                                preferredContact.contact_type,
                                preferredContact.contact_value,
                                contactMessage
                              );
                              window.open(url, '_blank');
                              if (request.status === 'pending') {
                                onStatusUpdate('contacted');
                              }
                            }}
                          >
                            Contact User
                            <ExternalLink className="ml-1 h-3 w-3" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Admin Notes */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Admin Notes</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Textarea
                        value={adminNotes}
                        onChange={(e) => setAdminNotes(e.target.value)}
                        placeholder="Add notes about this request..."
                        rows={3}
                      />
                    </CardContent>
                  </Card>

                  {/* Status Actions */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Update Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex space-x-2">
                        {request.status === 'pending' && (
                          <Button
                            onClick={() => onStatusUpdate('contacted', adminNotes)}
                            disabled={isUpdating}
                          >
                            Mark as Contacted
                          </Button>
                        )}
                        
                        {['pending', 'contacted'].includes(request.status) && (
                          <>
                            <Button
                              onClick={() => onStatusUpdate('approved', adminNotes)}
                              disabled={isUpdating}
                            >
                              Approve
                            </Button>
                            <Button
                              variant="destructive"
                              onClick={() => onStatusUpdate('rejected', adminNotes)}
                              disabled={isUpdating}
                            >
                              Reject
                            </Button>
                          </>
                        )}
                        
                        {request.status === 'approved' && (
                          <Button
                            onClick={() => onStatusUpdate('completed', adminNotes)}
                            disabled={isUpdating}
                          >
                            Mark as Completed
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </DialogContent>
            </Dialog>

            {/* Quick Actions */}
            {preferredContact && request.status === 'pending' && (
              <Button
                size="sm"
                onClick={() => {
                  const url = generateContactUrl(
                    preferredContact.contact_type,
                    preferredContact.contact_value,
                    contactMessage
                  );
                  window.open(url, '_blank');
                  onStatusUpdate('contacted');
                }}
              >
                <MessageCircle className="h-3 w-3 mr-1" />
                Contact
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}