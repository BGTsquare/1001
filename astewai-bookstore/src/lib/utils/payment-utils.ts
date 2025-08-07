import type { PurchaseRequest } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle, XCircle, MessageCircle, X } from 'lucide-react';

export const getStatusBadge = (status: PurchaseRequest['status']) => {
  const variants = {
    pending: { 
      variant: 'secondary' as const, 
      icon: Clock, 
      label: 'Pending', 
      color: 'text-orange-600' 
    },
    contacted: { 
      variant: 'default' as const, 
      icon: MessageCircle, 
      label: 'In Review', 
      color: 'text-blue-600' 
    },
    approved: { 
      variant: 'default' as const, 
      icon: CheckCircle, 
      label: 'Approved', 
      color: 'text-green-600' 
    },
    rejected: { 
      variant: 'destructive' as const, 
      icon: XCircle, 
      label: 'Rejected', 
      color: 'text-red-600' 
    },
    completed: { 
      variant: 'default' as const, 
      icon: CheckCircle, 
      label: 'Completed', 
      color: 'text-green-600' 
    },
    cancelled: { 
      variant: 'outline' as const, 
      icon: X, 
      label: 'Cancelled', 
      color: 'text-gray-600' 
    },
  };

  return variants[status] || variants.pending;
};

export const canCancelRequest = (request: PurchaseRequest): boolean => {
  return ['pending', 'contacted'].includes(request.status);
};

export const canDownloadReceipt = (request: PurchaseRequest): boolean => {
  return ['approved', 'completed'].includes(request.status);
};

export const getItemDisplayInfo = (request: PurchaseRequest) => {
  const itemName = request.book?.title || request.bundle?.title || 'Unknown Item';
  const itemType = request.item_type === 'book' ? 'Book' : 'Bundle';
  const coverImage = request.book?.cover_image_url || request.bundle?.cover_image_url;
  
  return { itemName, itemType, coverImage };
};