import { useMemo } from 'react';
import type { NotificationData } from '@/lib/types/notifications';

export interface NotificationPriority {
  level: 'low' | 'medium' | 'high' | 'normal';
  color: string;
  urgentThresholdHours: number;
  mediumThresholdHours: number;
}

export function useNotificationPriority(notification: NotificationData): NotificationPriority {
  return useMemo(() => {
    if (notification.type === 'admin_approval_required') {
      const createdAt = new Date(notification.created_at);
      const now = new Date();
      const hoursDiff = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60));
      
      if (hoursDiff >= 24) {
        return { 
          level: 'high', 
          color: 'bg-red-100 border-red-200',
          urgentThresholdHours: 24,
          mediumThresholdHours: 8
        };
      }
      if (hoursDiff >= 8) {
        return { 
          level: 'medium', 
          color: 'bg-yellow-100 border-yellow-200',
          urgentThresholdHours: 24,
          mediumThresholdHours: 8
        };
      }
      return { 
        level: 'low', 
        color: 'bg-blue-100 border-blue-200',
        urgentThresholdHours: 24,
        mediumThresholdHours: 8
      };
    }
    return { 
      level: 'normal', 
      color: 'bg-gray-50 border-gray-200',
      urgentThresholdHours: 24,
      mediumThresholdHours: 8
    };
  }, [notification.type, notification.created_at]);
}