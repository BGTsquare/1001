import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { NotificationIcon } from './notification-icon';
import { useNotificationPriority } from '@/hooks/use-notification-priority';
import type { NotificationData } from '@/lib/types/notifications';
import { 
  DollarSign,
  User,
  XCircle
} from 'lucide-react';
import { format } from 'date-fns';

interface NotificationItemProps {
  notification: NotificationData;
  onNotificationClick: (notification: NotificationData) => void;
  onClearNotification: (notificationId: string) => void;
}

export function NotificationItem({ 
  notification, 
  onNotificationClick, 
  onClearNotification 
}: NotificationItemProps) {
  const priority = useNotificationPriority(notification);

  return (
    <div
      className={`p-3 rounded-lg border cursor-pointer transition-all hover:shadow-sm ${
        priority.color
      } ${!notification.read ? 'ring-2 ring-primary/20' : ''}`}
      onClick={() => onNotificationClick(notification)}
    >
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0 mt-1">
          <NotificationIcon notification={notification} />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h4 className="text-sm font-semibold truncate">
              {notification.title}
            </h4>
            <div className="flex items-center space-x-2">
              {!notification.read && (
                <div className="w-2 h-2 bg-primary rounded-full"></div>
              )}
              <span className="text-xs text-muted-foreground">
                {format(new Date(notification.created_at), 'MMM d, HH:mm')}
              </span>
            </div>
          </div>
          
          <p className="text-sm text-muted-foreground mb-2">
            {notification.message}
          </p>
          
          {notification.data && (
            <div className="flex items-center space-x-4 text-xs text-muted-foreground">
              {notification.data.amount && (
                <div className="flex items-center space-x-1">
                  <DollarSign className="h-3 w-3" />
                  <span>${notification.data.amount}</span>
                </div>
              )}
              {notification.data.userDisplayName && (
                <div className="flex items-center space-x-1">
                  <User className="h-3 w-3" />
                  <span>{notification.data.userDisplayName}</span>
                </div>
              )}
              {priority.level === 'high' && (
                <Badge variant="destructive" className="text-xs">
                  Urgent
                </Badge>
              )}
            </div>
          )}
        </div>
        
        <div className="flex-shrink-0">
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              onClearNotification(notification.id);
            }}
            className="h-6 w-6 p-0"
            aria-label="Clear notification"
          >
            <XCircle className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}