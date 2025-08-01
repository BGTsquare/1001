'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { generateContactUrl, contactMethodDisplayNames, contactMethodIcons } from '@/lib/validation/contact-validation';
import { generatePurchaseInquiryMessage } from '@/lib/utils/message-templates';
import type { AdminContactInfo, Book, Bundle } from '@/types';
import { MessageCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface QuickContactButtonsProps {
  item: Book | Bundle;
  itemType: 'book' | 'bundle';
  onContactInitiated?: (contactMethod: string) => void;
  className?: string;
}

export function QuickContactButtons({ 
  item, 
  itemType, 
  onContactInitiated,
  className 
}: QuickContactButtonsProps) {
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
    return generatePurchaseInquiryMessage(item, itemType);
  };

  const handleQuickContact = (contact: AdminContactInfo) => {
    const message = generateMessageTemplate(contact);
    const contactUrl = generateContactUrl(contact.contact_type, contact.contact_value, message);
    
    // Track contact initiation
    onContactInitiated?.(contact.contact_type);
    
    // Open contact URL
    window.open(contactUrl, '_blank');
    
    // Show success message
    toast.success(`Opening ${contactMethodDisplayNames[contact.contact_type]}...`);
  };

  if (contactsLoading) {
    return (
      <div className={`flex items-center justify-center py-4 ${className}`}>
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
        <span className="text-sm text-muted-foreground">Loading contact options...</span>
      </div>
    );
  }

  if (contacts.length === 0) {
    return (
      <div className={`text-center py-4 ${className}`}>
        <p className="text-sm text-muted-foreground">
          No contact methods available
        </p>
      </div>
    );
  }

  // Get primary contacts for each method
  const primaryContacts = contacts.filter(contact => contact.is_primary);
  const availableContacts = primaryContacts.length > 0 ? primaryContacts : contacts;

  // Group by contact type and take the first (primary or first available) for each type
  const contactsByType = availableContacts.reduce((acc, contact) => {
    if (!acc[contact.contact_type]) {
      acc[contact.contact_type] = contact;
    }
    return acc;
  }, {} as Record<string, AdminContactInfo>);

  return (
    <div className={`space-y-2 ${className}`}>
      <p className="text-sm font-medium text-center mb-3">Quick Contact:</p>
      <div className="grid gap-2">
        {Object.values(contactsByType).map((contact) => (
          <Button
            key={contact.id}
            variant="outline"
            size="sm"
            onClick={() => handleQuickContact(contact)}
            className="justify-start"
          >
            <span className="mr-2">{contactMethodIcons[contact.contact_type]}</span>
            <span>{contactMethodDisplayNames[contact.contact_type]}</span>
            {contact.display_name && (
              <span className="ml-auto text-xs text-muted-foreground">
                {contact.display_name}
              </span>
            )}
          </Button>
        ))}
      </div>
    </div>
  );
}

interface SingleContactButtonProps {
  item: Book | Bundle;
  itemType: 'book' | 'bundle';
  contactMethod?: 'telegram' | 'whatsapp' | 'email';
  onContactInitiated?: (contactMethod: string) => void;
  children?: React.ReactNode;
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

export function SingleContactButton({ 
  item, 
  itemType, 
  contactMethod,
  onContactInitiated,
  children,
  variant = "outline",
  size = "default",
  className 
}: SingleContactButtonProps) {
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
    return generatePurchaseInquiryMessage(item, itemType);
  };

  const handleContact = () => {
    let targetContact: AdminContactInfo | undefined;

    if (contactMethod) {
      // Find primary contact for the specified method, or first available
      targetContact = contacts.find(c => c.contact_type === contactMethod && c.is_primary) ||
                     contacts.find(c => c.contact_type === contactMethod);
    } else {
      // Find any primary contact, or first available
      targetContact = contacts.find(c => c.is_primary) || contacts[0];
    }

    if (!targetContact) {
      toast.error('No contact method available');
      return;
    }

    const message = generateMessageTemplate(targetContact);
    const contactUrl = generateContactUrl(targetContact.contact_type, targetContact.contact_value, message);
    
    // Track contact initiation
    onContactInitiated?.(targetContact.contact_type);
    
    // Open contact URL
    window.open(contactUrl, '_blank');
    
    // Show success message
    toast.success(`Opening ${contactMethodDisplayNames[targetContact.contact_type]}...`);
  };

  if (contactsLoading) {
    return (
      <Button
        variant={variant}
        size={size}
        disabled
        className={className}
      >
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Loading...
      </Button>
    );
  }

  const availableContact = contactMethod 
    ? contacts.find(c => c.contact_type === contactMethod)
    : contacts.find(c => c.is_primary) || contacts[0];

  if (!availableContact) {
    return (
      <Button
        variant={variant}
        size={size}
        disabled
        className={className}
      >
        <MessageCircle className="mr-2 h-4 w-4" />
        No Contact Available
      </Button>
    );
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleContact}
      className={className}
    >
      {children || (
        <>
          <span className="mr-2">{contactMethodIcons[availableContact.contact_type]}</span>
          Contact via {contactMethodDisplayNames[availableContact.contact_type]}
        </>
      )}
    </Button>
  );
}