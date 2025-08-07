'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import type { PurchaseRequest } from '@/types';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  MessageCircle,
  DollarSign,
  Calendar,
  User,
  Book,
  Package
} from 'lucide-react';
import { format } from 'date-fns';

interface PaymentRequestCardProps {
  request: PurchaseRequest;
  isSelected: boolean;
  onSelect: (checked: boolean) => void;
  onViewDetails: () => void;
  showCheckbox?: boolean;
}

export function PaymentRequestCard({ 
  request, 
  isSelected, 
  onSelect, 
  onViewDetails,
  showCheckbox = false
}: PaymentRequestCardProps) {
  const itemName = request.book?.title || request.bundle?.title || 'Unknown Item';
  const itemType = request.item_type === 'book' ? 'Book' : 'Bundle';
  const ItemIcon = request.item_type === 'book' ? Book : Package;

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

  const getPriorityLevel = (request: PurchaseRequest) => {
    const createdAt = new Date(request.created_at);
    const now = new Date();
    const daysDiff = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff >= 7) return { level: 'high', label: 'High Priority', color: 'bg-red-100 text-red-800' };
    if (daysDiff >= 3) return { level: 'medium', label: 'Medium Priority', color: 'bg-yellow-100 text-yellow-800' };
    return { level: 'low', label: 'Normal', color: 'bg-green-100 text-green-800' };
  };

  const priority = getPriorityLevel(request);

  return (
    <Card className={`transition-all hover:shadow-md ${isSelected ? 'ring-2 ring-primary' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-start space-x-4">
          {showCheckbox && (
            <div className="flex items-center pt-1">
              <Checkbox
                checked={isSelected}
                onCheckedChange={onSelect}
              />
            </div>
          )}
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <ItemIcon className="h-4 w-4 text-muted-foreground" />
                  <h3 className="font-semibold truncate">{itemName}</h3>
                  <Badge variant="outline" className="text-xs">
                    {itemType}
                  </Badge>
                </div>
                
                <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-2">
                  <div className="flex items-center space-x-1">
                    <DollarSign className="h-3 w-3" />
                    <span className="font-medium">${request.amount.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-3 w-3" />
                    <span>{format(new Date(request.created_at), 'MMM d, yyyy')}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <User className="h-3 w-3" />
                    <span>Request #{request.id.slice(-8)}</span>
                  </div>
                </div>

                {request.user_message && (
                  <div className="bg-muted p-2 rounded text-sm mb-2">
                    <p className="text-muted-foreground line-clamp-2">
                      {request.user_message}
                    </p>
                  </div>
                )}
              </div>
              
              <div className="flex flex-col items-end space-y-2">
                {getStatusBadge(request.status)}
                {request.status === 'pending' && (
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${priority.color}`}
                  >
                    {priority.label}
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                {request.preferred_contact_method && (
                  <span>
                    Prefers: {request.preferred_contact_method}
                  </span>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onViewDetails}
                >
                  View Details
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}