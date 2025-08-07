import React from 'react';
import { 
  Bell, 
  Clock, 
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import type { NotificationData } from '@/lib/types/notifications';

interface NotificationIconProps {
  notification: NotificationData;
  className?: string;
}

export function NotificationIcon({ notification, className = "h-4 w-4" }: NotificationIconProps) {
  const getIcon = () => {
    switch (notification.type) {
      case 'admin_approval_required':
        return <AlertCircle className={`${className} text-orange-500`} />;
      case 'purchase_status_update':
        if (notification.data?.status === 'approved') {
          return <CheckCircle className={`${className} text-green-500`} />;
        }
        if (notification.data?.status === 'rejected') {
          return <XCircle className={`${className} text-red-500`} />;
        }
        return <Clock className={`${className} text-blue-500`} />;
      default:
        return <Bell className={`${className} text-gray-500`} />;
    }
  };

  return getIcon();
}