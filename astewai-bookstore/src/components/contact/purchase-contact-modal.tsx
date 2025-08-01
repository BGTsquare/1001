'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { ContactButton } from './contact-display';
import { generateContactUrl, contactMethodDisplayNames, contactMethodIcons } from '@/lib/validation/contact-validation';
import { generatePurchaseInquiryMessage, validateMessageLength } from '@/lib/utils/message-templates';
import type { AdminContactInfo, Book, Bundle } from '@/types';
import { MessageCircle, Copy, ExternalLink, Loader2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface PurchaseContactModalProps {
  item: Book | Bundle;
  itemType: 'book' | 'bundle';
  trigger?: React.ReactNode;
  onContactInitiated?: (contactMethod: string) => void;
}

export function PurchaseContactModal({ 
  item, 
  itemType, 
  trigger,
  onContactInitiated 
}: PurchaseContactModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<AdminContactInfo | null>(null);
  const [customMessage, setCustomMessage] = useState('');

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

  // Generate pre-filled message template
  const generateMessageTemplate = (contact: AdminContactInfo): string => {
    return generatePurchaseInquiryMessage(item, itemType, {
      userMessage: customMessage,
      includeUserMessage: true
    });
  };

  const handleContactSelect = (contact: AdminContactInfo) => {
    setSelectedContact(contact);
  };

  const handleContactNow = () => {
    if (!selectedContact) return;
    
    const message = generateMessageTemplate(selectedContact);
    const contactUrl = generateContactUrl(selectedContact.contact_type, selectedContact.contact_value, message);
    
    // Track contact initiation
    onContactInitiated?.(selectedContact.contact_type);
    
    // Open contact URL
    window.open(contactUrl, '_blank');
    
    // Show success message
    toast.success(`Opening ${contactMethodDisplayNames[selectedContact.contact_type]}...`);
    
    // Close modal
    setIsOpen(false);
  };

  const handleCopyMessage = async () => {
    if (!selectedContact) return;
    
    const message = generateMessageTemplate(selectedContact);
    
    try {
      await navigator.clipboard.writeText(message);
      toast.success('Message copied to clipboard!');
    } catch (error) {
      toast.error('Failed to copy message');
    }
  };

  const defaultTrigger = (
    <Button variant="outline" className="w-full">
      <MessageCircle className="mr-2 h-4 w-4" />
      Contact Admin
    </Button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Contact Admin for Purchase</DialogTitle>
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
                <CardTitle className="text-lg">Choose Contact Method</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3">
                  {contacts.map((contact) => (
                    <div
                      key={contact.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedContact?.id === contact.id
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => handleContactSelect(contact)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <span className="text-lg">{contactMethodIcons[contact.contact_type]}</span>
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-medium">
                                {contactMethodDisplayNames[contact.contact_type]}
                              </span>
                              {contact.is_primary && (
                                <Badge variant="secondary" className="text-xs">
                                  Primary
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {contact.display_name || contact.contact_value}
                            </p>
                          </div>
                        </div>
                        {selectedContact?.id === contact.id && (
                          <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                            <div className="w-2 h-2 rounded-full bg-white" />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
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

          {/* Custom Message */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Additional Message (Optional)</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Add any specific questions or requirements..."
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                rows={3}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {customMessage.length}/500 characters
              </p>
            </CardContent>
          </Card>

          {/* Message Preview */}
          {selectedContact && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Message Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-muted p-4 rounded-lg">
                  <pre className="whitespace-pre-wrap text-sm font-mono">
                    {generateMessageTemplate(selectedContact)}
                  </pre>
                </div>
                
                {/* Message validation */}
                {(() => {
                  const message = generateMessageTemplate(selectedContact);
                  const validation = validateMessageLength(message, selectedContact.contact_type);
                  
                  if (!validation.isValid) {
                    return (
                      <div className="flex items-center space-x-2 mt-2 p-2 bg-destructive/10 rounded">
                        <AlertTriangle className="h-4 w-4 text-destructive" />
                        <span className="text-sm text-destructive">
                          Message too long ({validation.currentLength}/{validation.maxLength} characters)
                        </span>
                      </div>
                    );
                  }
                  
                  return (
                    <p className="text-xs text-muted-foreground mt-2">
                      {validation.currentLength}/{validation.maxLength} characters
                    </p>
                  );
                })()}
                
                <div className="flex space-x-2 mt-4">
                  <Button
                    onClick={handleContactNow}
                    disabled={!selectedContact || !validateMessageLength(generateMessageTemplate(selectedContact), selectedContact.contact_type).isValid}
                    className="flex-1"
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Contact via {selectedContact ? contactMethodDisplayNames[selectedContact.contact_type] : 'Selected Method'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleCopyMessage}
                    disabled={!selectedContact}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}