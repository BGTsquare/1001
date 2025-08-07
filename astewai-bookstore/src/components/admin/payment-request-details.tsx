'use client';

import React, { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { ContactButton } from '@/components/contact/contact-display';
import { generateContactUrl, contactMethodDisplayNames } from '@/lib/validation/contact-validation';
import type { PurchaseRequest, AdminContactInfo } from '@/types';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  MessageCircle,
  DollarSign,
  Calendar,
  User,
  Book,
  Package,
  ExternalLink,
  Mail,
  Phone,
  MessageSquare,
  Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

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
    mutationFn: async ({ status, notes }: { status: string; notes?: string }) => {
      const response = await fetch(`/api/purchase-requests/${request.id}`, {
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
      toast.success('Request status updated successfully!');
      onStatusUpdate();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update request status');
    }
  });

  const itemName = request.book?.title || request.bundle?.title || 'Unknown Item';
  const itemType = request.item_type === 'book' ? 'Book' : 'Bundle';
  const ItemIcon = request.item_type === 'book' ? Book : Package;

  const preferredContact = request.preferred_contact_method
    ? contacts.find(c => c.contact_type === request.preferred_contact_method && c.is_primary)
    : contacts.find(c => c.is_primary);

  const getStatusBadge = (status: PurchaseRequest['status']) => {
    const variants = {
      pending: { variant: 'secondary' as const, icon: Clock, label: 'Pending', color: 'text-orange-600' },
      contacted: { variant: 'default' as const, icon: MessageCircle, label: 'Contacted', color: 'text-blue-600' },
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

  const contactMessage = generateContactMessage(request);

  const getContactIcon = (contactType: string) => {
    switch (contactType) {
      case 'email': return Mail;
      case 'phone': return Phone;
      case 'whatsapp': return MessageSquare;
      case 'telegram': return MessageSquare;
      default: return MessageCircle;
    }
  };

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
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Request Overview */}
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
                      {getStatusBadge(request.status)}
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

            {/* Item Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Item Details</CardTitle>
              </CardHeader>
              <CardContent>
                {request.book && (
                  <div className="space-y-3">
                    <div className="flex items-start space-x-4">
                      {request.book.cover_image_url && (
                        <img
                          src={request.book.cover_image_url}
                          alt={request.book.title}
                          className="w-16 h-20 object-cover rounded"
                        />
                      )}
                      <div className="flex-1">
                        <h4 className="font-semibold">{request.book.title}</h4>
                        {request.book.author && (
                          <p className="text-sm text-muted-foreground">by {request.book.author}</p>
                        )}
                        {request.book.description && (
                          <p className="text-sm text-muted-foreground mt-2 line-clamp-3">
                            {request.book.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {request.bundle && (
                  <div className="space-y-3">
                    <div className="flex items-start space-x-4">
                      {request.bundle.cover_image_url && (
                        <img
                          src={request.bundle.cover_image_url}
                          alt={request.bundle.title}
                          className="w-16 h-20 object-cover rounded"
                        />
                      )}
                      <div className="flex-1">
                        <h4 className="font-semibold">{request.bundle.title}</h4>
                        {request.bundle.description && (
                          <p className="text-sm text-muted-foreground mt-2 line-clamp-3">
                            {request.bundle.description}
                          </p>
                        )}
                        <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
                          <span>Original: ${request.bundle.original_price?.toFixed(2)}</span>
                          <span>Bundle: ${request.bundle.bundle_price?.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

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
                  rows={4}
                  className="mb-3"
                />
                <p className="text-xs text-muted-foreground">
                  Notes will be saved when you update the request status.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Information */}
            {preferredContact && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Contact User</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="font-medium text-sm text-muted-foreground mb-1">
                      Preferred Method
                    </p>
                    <div className="flex items-center space-x-2">
                      {React.createElement(getContactIcon(preferredContact.contact_type), {
                        className: "h-4 w-4"
                      })}
                      <span className="font-medium">
                        {contactMethodDisplayNames[preferredContact.contact_type]}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {preferredContact.display_name || preferredContact.contact_value}
                    </p>
                  </div>
                  
                  <Button
                    className="w-full"
                    onClick={() => {
                      const url = generateContactUrl(
                        preferredContact.contact_type,
                        preferredContact.contact_value,
                        contactMessage
                      );
                      window.open(url, '_blank');
                      if (request.status === 'pending') {
                        updateStatusMutation.mutate({ status: 'contacted', notes: adminNotes });
                      }
                    }}
                  >
                    Contact User
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {request.status === 'pending' && (
                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={() => updateStatusMutation.mutate({ status: 'contacted', notes: adminNotes })}
                    disabled={updateStatusMutation.isPending}
                  >
                    {updateStatusMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <MessageCircle className="h-4 w-4 mr-2" />
                    )}
                    Mark as Contacted
                  </Button>
                )}
                
                {['pending', 'contacted'].includes(request.status) && (
                  <>
                    <Button
                      className="w-full"
                      onClick={() => updateStatusMutation.mutate({ status: 'approved', notes: adminNotes })}
                      disabled={updateStatusMutation.isPending}
                    >
                      {updateStatusMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <CheckCircle className="h-4 w-4 mr-2" />
                      )}
                      Approve Request
                    </Button>
                    <Button
                      className="w-full"
                      variant="destructive"
                      onClick={() => updateStatusMutation.mutate({ status: 'rejected', notes: adminNotes })}
                      disabled={updateStatusMutation.isPending}
                    >
                      {updateStatusMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <XCircle className="h-4 w-4 mr-2" />
                      )}
                      Reject Request
                    </Button>
                  </>
                )}
                
                {request.status === 'approved' && (
                  <Button
                    className="w-full"
                    onClick={() => updateStatusMutation.mutate({ status: 'completed', notes: adminNotes })}
                    disabled={updateStatusMutation.isPending}
                  >
                    {updateStatusMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <CheckCircle className="h-4 w-4 mr-2" />
                    )}
                    Mark as Completed
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Request Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Request Created</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(request.created_at), 'MMM d, yyyy HH:mm')}
                      </p>
                    </div>
                  </div>
                  
                  {request.updated_at && request.updated_at !== request.created_at && (
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Last Updated</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(request.updated_at), 'MMM d, yyyy HH:mm')}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}