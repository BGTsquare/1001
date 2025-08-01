'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { generateContactUrl, contactMethodDisplayNames, contactMethodIcons } from '@/lib/validation/contact-validation';
import type { AdminContactInfo, ContactMethod } from '@/types';
import { ExternalLink, MessageCircle, Mail, Phone } from 'lucide-react';

interface ContactDisplayProps {
  contacts: AdminContactInfo[];
  title?: string;
  showPrimaryOnly?: boolean;
  className?: string;
}

export function ContactDisplay({ 
  contacts, 
  title = "Contact Admin", 
  showPrimaryOnly = false,
  className 
}: ContactDisplayProps) {
  const displayContacts = showPrimaryOnly 
    ? contacts.filter(contact => contact.is_primary)
    : contacts;

  if (displayContacts.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-sm">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No contact information available at the moment.
          </p>
        </CardContent>
      </Card>
    );
  }

  const getContactIcon = (type: ContactMethod) => {
    switch (type) {
      case 'telegram':
        return <MessageCircle className="h-4 w-4" />;
      case 'whatsapp':
        return <Phone className="h-4 w-4" />;
      case 'email':
        return <Mail className="h-4 w-4" />;
      default:
        return <ExternalLink className="h-4 w-4" />;
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {displayContacts.map((contact) => (
          <div key={contact.id} className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {getContactIcon(contact.contact_type)}
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">
                    {contactMethodDisplayNames[contact.contact_type]}
                  </span>
                  {contact.is_primary && (
                    <Badge variant="secondary" className="text-xs">
                      Primary
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {contact.display_name || contact.contact_value}
                </p>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                const url = generateContactUrl(contact.contact_type, contact.contact_value);
                window.open(url, '_blank');
              }}
            >
              Contact
              <ExternalLink className="ml-1 h-3 w-3" />
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

interface ContactMethodSelectorProps {
  contacts: AdminContactInfo[];
  onSelect: (contact: AdminContactInfo) => void;
  selectedMethod?: ContactMethod;
  className?: string;
}

export function ContactMethodSelector({ 
  contacts, 
  onSelect, 
  selectedMethod,
  className 
}: ContactMethodSelectorProps) {
  const groupedContacts = contacts.reduce((acc, contact) => {
    if (!acc[contact.contact_type]) {
      acc[contact.contact_type] = [];
    }
    acc[contact.contact_type].push(contact);
    return acc;
  }, {} as Record<ContactMethod, AdminContactInfo[]>);

  return (
    <div className={`space-y-2 ${className}`}>
      <p className="text-sm font-medium">Choose contact method:</p>
      <div className="grid gap-2">
        {Object.entries(groupedContacts).map(([method, methodContacts]) => {
          const primaryContact = methodContacts.find(c => c.is_primary) || methodContacts[0];
          const isSelected = selectedMethod === method;
          
          return (
            <Button
              key={method}
              variant={isSelected ? "default" : "outline"}
              className="justify-start"
              onClick={() => onSelect(primaryContact)}
            >
              <div className="flex items-center space-x-2">
                <span>{contactMethodIcons[method]}</span>
                <span>{contactMethodDisplayNames[method]}</span>
                {primaryContact.display_name && (
                  <span className="text-xs text-muted-foreground">
                    ({primaryContact.display_name})
                  </span>
                )}
              </div>
            </Button>
          );
        })}
      </div>
    </div>
  );
}

interface ContactButtonProps {
  contact: AdminContactInfo;
  message?: string;
  children?: React.ReactNode;
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

export function ContactButton({ 
  contact, 
  message, 
  children, 
  variant = "default",
  size = "default",
  className 
}: ContactButtonProps) {
  const handleClick = () => {
    const url = generateContactUrl(contact.contact_type, contact.contact_value, message);
    window.open(url, '_blank');
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      className={className}
    >
      {children || (
        <>
          {contactMethodIcons[contact.contact_type]} Contact via {contactMethodDisplayNames[contact.contact_type]}
        </>
      )}
    </Button>
  );
}