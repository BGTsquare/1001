'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { adminContactInfoSchema } from '@/lib/validation/contact-validation';
import { contactMethodDisplayNames } from '@/lib/validation/contact-validation';
import type { AdminContactForm, AdminContactInfo, ContactMethod } from '@/types';
import { Plus, Edit, Trash2, MessageCircle, Mail, Phone, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export function AdminContactManager() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<AdminContactInfo | null>(null);
  const queryClient = useQueryClient();

  // Fetch admin's contact info
  const { data: contacts = [], isLoading } = useQuery({
    queryKey: ['admin-contact-info'],
    queryFn: async () => {
      const response = await fetch('/api/admin/contact');
      if (!response.ok) {
        throw new Error('Failed to fetch contact information');
      }
      const result = await response.json();
      return result.data as AdminContactInfo[];
    }
  });

  // Create contact mutation
  const createMutation = useMutation({
    mutationFn: async (data: AdminContactForm) => {
      const response = await fetch('/api/admin/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create contact information');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-contact-info'] });
      toast.success('Contact information created successfully!');
      setIsCreateOpen(false);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create contact information');
    }
  });

  // Update contact mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<AdminContactForm> }) => {
      const response = await fetch(`/api/admin/contact/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update contact information');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-contact-info'] });
      toast.success('Contact information updated successfully!');
      setEditingContact(null);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update contact information');
    }
  });

  // Delete contact mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/admin/contact/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete contact information');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-contact-info'] });
      toast.success('Contact information deleted successfully!');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete contact information');
    }
  });

  const getContactIcon = (type: ContactMethod) => {
    switch (type) {
      case 'telegram':
        return <MessageCircle className="h-4 w-4" />;
      case 'whatsapp':
        return <Phone className="h-4 w-4" />;
      case 'email':
        return <Mail className="h-4 w-4" />;
      default:
        return <Mail className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="ml-2">Loading contact information...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Contact Information</h2>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Contact Method
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Contact Method</DialogTitle>
            </DialogHeader>
            <ContactForm
              onSubmit={(data) => createMutation.mutate(data)}
              isLoading={createMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      {contacts.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground mb-4">
              No contact methods configured yet.
            </p>
            <p className="text-sm text-muted-foreground">
              Add contact methods so users can reach you for purchase requests.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {contacts.map((contact) => (
            <Card key={contact.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center space-x-3">
                  {getContactIcon(contact.contact_type)}
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">
                        {contactMethodDisplayNames[contact.contact_type]}
                      </span>
                      {contact.is_primary && (
                        <Badge variant="default">Primary</Badge>
                      )}
                      {!contact.is_active && (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {contact.display_name || contact.contact_value}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {contact.contact_value}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditingContact(contact)}
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      if (confirm('Are you sure you want to delete this contact method?')) {
                        deleteMutation.mutate(contact.id);
                      }
                    }}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingContact} onOpenChange={() => setEditingContact(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Contact Method</DialogTitle>
          </DialogHeader>
          {editingContact && (
            <ContactForm
              initialData={{
                contactType: editingContact.contact_type,
                contactValue: editingContact.contact_value,
                displayName: editingContact.display_name || '',
                isActive: editingContact.is_active,
                isPrimary: editingContact.is_primary,
              }}
              onSubmit={(data) => 
                updateMutation.mutate({ 
                  id: editingContact.id, 
                  data 
                })
              }
              isLoading={updateMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface ContactFormProps {
  initialData?: AdminContactForm;
  onSubmit: (data: AdminContactForm) => void;
  isLoading?: boolean;
}

function ContactForm({ initialData, onSubmit, isLoading }: ContactFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset
  } = useForm<AdminContactForm>({
    resolver: zodResolver(adminContactInfoSchema),
    defaultValues: initialData || {
      contactType: 'email',
      contactValue: '',
      displayName: '',
      isActive: true,
      isPrimary: false,
    }
  });

  const contactType = watch('contactType');

  const getPlaceholder = (type: ContactMethod) => {
    switch (type) {
      case 'telegram':
        return '@username';
      case 'whatsapp':
        return '+1234567890';
      case 'email':
        return 'admin@example.com';
      default:
        return '';
    }
  };

  const handleFormSubmit = (data: AdminContactForm) => {
    onSubmit(data);
    if (!initialData) {
      reset();
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div>
        <label className="text-sm font-medium">Contact Type</label>
        <Select
          value={contactType}
          onValueChange={(value: ContactMethod) => setValue('contactType', value)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="email">Email</SelectItem>
            <SelectItem value="telegram">Telegram</SelectItem>
            <SelectItem value="whatsapp">WhatsApp</SelectItem>
          </SelectContent>
        </Select>
        {errors.contactType && (
          <p className="text-sm text-destructive mt-1">{errors.contactType.message}</p>
        )}
      </div>

      <div>
        <label className="text-sm font-medium">Contact Value</label>
        <Input
          placeholder={getPlaceholder(contactType)}
          {...register('contactValue')}
        />
        {errors.contactValue && (
          <p className="text-sm text-destructive mt-1">{errors.contactValue.message}</p>
        )}
      </div>

      <div>
        <label className="text-sm font-medium">Display Name (Optional)</label>
        <Input
          placeholder="e.g., Support Team, John Doe"
          {...register('displayName')}
        />
        {errors.displayName && (
          <p className="text-sm text-destructive mt-1">{errors.displayName.message}</p>
        )}
      </div>

      <div className="flex items-center space-x-4">
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            {...register('isActive')}
            className="rounded"
          />
          <span className="text-sm">Active</span>
        </label>

        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            {...register('isPrimary')}
            className="rounded"
          />
          <span className="text-sm">Primary for this method</span>
        </label>
      </div>

      <div className="flex space-x-2 pt-4">
        <Button type="submit" disabled={isLoading} className="flex-1">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {initialData ? 'Updating...' : 'Creating...'}
            </>
          ) : (
            initialData ? 'Update Contact' : 'Add Contact'
          )}
        </Button>
      </div>
    </form>
  );
}