import React, { useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { generateContactUrl, contactMethodDisplayNames } from '@/lib/validation/contact-validation';
import { getContactIcon, generateContactMessage } from '@/lib/utils/payment-request-utils';
import type { PurchaseRequest, AdminContactInfo } from '@/types';
import { ExternalLink } from 'lucide-react';

interface ContactSidebarProps {
  contact: AdminContactInfo;
  request: PurchaseRequest;
  onContact: () => void;
}

export function ContactSidebar({ contact, request, onContact }: ContactSidebarProps) {
  const ContactIcon = getContactIcon(contact.contact_type);
  
  const handleContactClick = useCallback(() => {
    const message = generateContactMessage(request);
    const url = generateContactUrl(
      contact.contact_type,
      contact.contact_value,
      message
    );
    
    window.open(url, '_blank');
    onContact();
  }, [contact, request, onContact]);

  return (
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
            <ContactIcon className="h-4 w-4" />
            <span className="font-medium">
              {contactMethodDisplayNames[contact.contact_type]}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            {contact.display_name || contact.contact_value}
          </p>
        </div>
        
        <Button
          className="w-full"
          onClick={handleContactClick}
        >
          Contact User
          <ExternalLink className="ml-2 h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
}