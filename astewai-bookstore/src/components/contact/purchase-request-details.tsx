'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PurchaseRequestStatusBadge, PurchaseRequestStatusDescription } from './purchase-request-status';
import { 
  getItemName, 
  getItemType, 
  getCoverImageUrl, 
  getPreferredContact,
  hasAuthor,
  getAuthor
} from '@/lib/utils/purchase-request-utils';
import { generateContactUrl, contactMethodDisplayNames } from '@/lib/validation/contact-validation';
import type { PurchaseRequest, AdminContactInfo } from '@/types';
import { ExternalLink } from 'lucide-react';
import { format } from 'date-fns';

interface PurchaseRequestDetailsProps {
  request: PurchaseRequest;
  contacts: AdminContactInfo[];
}

export function PurchaseRequestDetails({ request, contacts }: PurchaseRequestDetailsProps) {
  const itemName = getItemName(request);
  const itemType = getItemType(request);
  const coverImageUrl = getCoverImageUrl(request);
  const preferredContact = getPreferredContact(request, contacts);
  const author = getAuthor(request);

  return (
    <div className="space-y-4">
      {/* Item Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Item Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-start space-x-4">
            {coverImageUrl && (
              <img
                src={coverImageUrl}
                alt={itemName}
                className="w-16 h-20 object-cover rounded"
              />
            )}
            <div className="flex-1">
              <h3 className="font-semibold">{itemName}</h3>
              {hasAuthor(request) && (
                <p className="text-sm text-muted-foreground">by {author}</p>
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
              <PurchaseRequestStatusBadge status={request.status} />
            </div>
            
            <PurchaseRequestStatusDescription status={request.status} />

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