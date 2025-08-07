import type { PurchaseRequest } from '@/types';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  MessageCircle,
  Mail,
  Phone,
  MessageSquare
} from 'lucide-react';

export const getStatusConfig = (status: PurchaseRequest['status']) => {
  const configs = {
    pending: { 
      variant: 'secondary' as const, 
      icon: Clock, 
      label: 'Pending', 
      color: 'text-orange-600' 
    },
    contacted: { 
      variant: 'default' as const, 
      icon: MessageCircle, 
      label: 'Contacted', 
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
  };

  return configs[status];
};

export const getContactIcon = (contactType: string) => {
  const icons = {
    email: Mail,
    phone: Phone,
    whatsapp: MessageSquare,
    telegram: MessageSquare,
  };
  
  return icons[contactType as keyof typeof icons] || MessageCircle;
};

export const generateContactMessage = (request: PurchaseRequest) => {
  const itemName = request.book?.title || request.bundle?.title || 'Unknown Item';
  const itemType = request.item_type === 'book' ? 'Book' : 'Bundle';
  
  let message = `Hi! Regarding your purchase request for the ${itemType.toLowerCase()}: "${itemName}" (${request.amount}).`;
  
  if (request.user_message) {
    message += `\n\nYour message: ${request.user_message}`;
  }
  
  message += `\n\nRequest ID: ${request.id}`;
  
  return message;
};

export const getAvailableActions = (status: PurchaseRequest['status']) => {
  return {
    canMarkContacted: status === 'pending',
    canApprove: ['pending', 'contacted'].includes(status),
    canReject: ['pending', 'contacted'].includes(status),
    canComplete: status === 'approved',
  };
};