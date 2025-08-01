'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ContactDisplay, ContactMethodSelector } from './contact-display';
import { purchaseRequestSchema } from '@/lib/validation/contact-validation';
import { contactMethodDisplayNames } from '@/lib/validation/contact-validation';
import type { PurchaseRequestForm, AdminContactInfo, ContactMethod, Book, Bundle } from '@/types';
import { ShoppingCart, MessageCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface PurchaseRequestFormProps {
  item: Book | Bundle;
  itemType: 'book' | 'bundle';
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}

export function PurchaseRequestFormComponent({ 
  item, 
  itemType, 
  onSuccess,
  trigger 
}: PurchaseRequestFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<AdminContactInfo | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset
  } = useForm<PurchaseRequestForm>({
    resolver: zodResolver(purchaseRequestSchema),
    defaultValues: {
      itemType,
      itemId: item.id,
      amount: item.price,
    }
  });

  const preferredContactMethod = watch('preferredContactMethod');

  // Fetch admin contacts
  const { data: contacts = [], isLoading: contactsLoading } = useQuery({
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

  // Create purchase request mutation
  const createRequestMutation = useMutation({
    mutationFn: async (data: PurchaseRequestForm) => {
      const response = await fetch('/api/purchase-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create purchase request');
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success('Purchase request created successfully!');
      reset();
      setIsOpen(false);
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create purchase request');
    }
  });

  const onSubmit = (data: PurchaseRequestForm) => {
    createRequestMutation.mutate(data);
  };

  const handleContactSelect = (contact: AdminContactInfo) => {
    setSelectedContact(contact);
    setValue('preferredContactMethod', contact.contact_type);
  };

  const defaultTrigger = (
    <Button className="w-full">
      <ShoppingCart className="mr-2 h-4 w-4" />
      Request Purchase
    </Button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Request Purchase</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Item Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Item Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start space-x-4">
                {item.cover_image_url && (
                  <img
                    src={item.cover_image_url}
                    alt={item.title}
                    className="w-16 h-20 object-cover rounded"
                  />
                )}
                <div className="flex-1">
                  <h3 className="font-semibold">{item.title}</h3>
                  {'author' in item && (
                    <p className="text-sm text-muted-foreground">by {item.author}</p>
                  )}
                  <div className="flex items-center space-x-2 mt-2">
                    <Badge variant="secondary">
                      {itemType === 'book' ? 'Book' : 'Bundle'}
                    </Badge>
                    <span className="font-semibold text-lg">${item.price}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Method Selection */}
          {contactsLoading ? (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="ml-2">Loading contact information...</span>
              </CardContent>
            </Card>
          ) : contacts.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Contact Method</CardTitle>
              </CardHeader>
              <CardContent>
                <ContactMethodSelector
                  contacts={contacts}
                  onSelect={handleContactSelect}
                  selectedMethod={preferredContactMethod}
                />
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground">
                  No admin contact information available. Please try again later.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Purchase Request Form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Additional Information</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Amount</label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    {...register('amount', { valueAsNumber: true })}
                    readOnly
                    className="bg-muted"
                  />
                  {errors.amount && (
                    <p className="text-sm text-destructive mt-1">{errors.amount.message}</p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium">Message (Optional)</label>
                  <Textarea
                    placeholder="Add any additional information or special requests..."
                    {...register('userMessage')}
                    rows={3}
                  />
                  {errors.userMessage && (
                    <p className="text-sm text-destructive mt-1">{errors.userMessage.message}</p>
                  )}
                </div>

                <div className="flex space-x-2 pt-4">
                  <Button
                    type="submit"
                    disabled={createRequestMutation.isPending || contacts.length === 0}
                    className="flex-1"
                  >
                    {createRequestMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating Request...
                      </>
                    ) : (
                      <>
                        <MessageCircle className="mr-2 h-4 w-4" />
                        Create Purchase Request
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsOpen(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Contact Preview */}
          {selectedContact && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Selected Contact</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">
                      {contactMethodDisplayNames[selectedContact.contact_type]}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {selectedContact.display_name || selectedContact.contact_value}
                    </p>
                  </div>
                  <Badge variant="secondary">
                    {selectedContact.is_primary ? 'Primary' : 'Available'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}