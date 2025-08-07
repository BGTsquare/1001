'use client';

import { Badge } from '@/components/ui/badge';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  MessageCircle 
} from 'lucide-react';
import type { PurchaseRequest } from '@/types';

interface StatusConfig {
  variant: 'secondary' | 'default' | 'destructive';
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  color: string;
  description: string;
}

const STATUS_CONFIG: Record<PurchaseRequest['status'], StatusConfig> = {
  pending: { 
    variant: 'secondary', 
    icon: Clock, 
    label: 'Pending Review', 
    color: 'text-orange-600',
    description: 'Your request is waiting for admin review. You will be contacted soon.'
  },
  contacted: { 
    variant: 'default', 
    icon: MessageCircle, 
    label: 'Admin Contacted', 
    color: 'text-blue-600',
    description: 'An admin has reached out to you. Please check your preferred contact method.'
  },
  approved: { 
    variant: 'default', 
    icon: CheckCircle, 
    label: 'Approved', 
    color: 'text-green-600',
    description: 'Your request has been approved! Please complete the payment process.'
  },
  rejected: { 
    variant: 'destructive', 
    icon: XCircle, 
    label: 'Rejected', 
    color: 'text-red-600',
    description: 'Your request was not approved. Contact admin for more information.'
  },
  completed: { 
    variant: 'default', 
    icon: CheckCircle, 
    label: 'Completed', 
    color: 'text-green-600',
    description: 'Your purchase is complete! The item should be available in your library.'
  },
};

interface PurchaseRequestStatusBadgeProps {
  status: PurchaseRequest['status'];
  className?: string;
}

export function PurchaseRequestStatusBadge({ status, className }: PurchaseRequestStatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className={`flex items-center space-x-1 ${className}`}>
      <Icon className={`h-3 w-3 ${config.color}`} />
      <span>{config.label}</span>
    </Badge>
  );
}

interface PurchaseRequestStatusDescriptionProps {
  status: PurchaseRequest['status'];
  className?: string;
}

export function PurchaseRequestStatusDescription({ status, className }: PurchaseRequestStatusDescriptionProps) {
  const config = STATUS_CONFIG[status];
  
  return (
    <p className={`text-sm text-muted-foreground ${className}`}>
      {config.description}
    </p>
  );
}

export { STATUS_CONFIG };