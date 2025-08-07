'use client';

import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

import { useNotifications } from '@/contexts/notification-context';
import { NotificationIcon } from './notification-icon';
import { NotificationItem } from './notification-item';
import type { PurchaseRequest } from '@/types';
import type { NotificationData } from '@/lib/types/notifications';
import { 
  Bell, 
  DollarSign,
  User,
  XCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface PaymentApprovalNotificationsProps {
  onViewRequest?: (requestId: string) => void;
}

export function PaymentApprovalNotifications({ 
  onViewRequest 
}: PaymentApprovalNotificationsProps) {
  const { notifications, markAsRead, clearNotification } = useNotifications();

  // Filter for payment-related notifications with memoization
  const paymentNotifications = useMemo(() => 
    notifications.filter(
      notification => 
        notification.type === 'admin_approval_required' || 
        notification.type === 'purchase_status_update'
    ),
    [notifications]
  );

  // Fetch recent pending requests for quick stats
  const { data: pendingRequests = [], isLoading: isLoadingRequests, error: requestsError } = useQuery({
    queryKey: ['purchase-requests', 'pending'],
    queryFn: async () => {
      const response = await fetch('/api/purchase-requests?admin=true&status=pending');
      if (!response.ok) {
        throw new Error(`Failed to fetch requests: ${response.status}`);
      }
      const result = await response.json();
      return result.data as PurchaseRequest[];
    },
    staleTime: 30000, // Cache for 30 seconds
    refetchInterval: 60000, // Refetch every minute
    retry: 2,
    onError: (error) => {
      console.error('Failed to fetch pending requests:', error);
      toast.error('Failed to load pending requests');
    }
  });

  const handleNotificationClick = (notification: NotificationData) => {
    markAsRead(notification.id);
    
    if (notification.data?.requestId && onViewRequest) {
      onViewRequest(notification.data.requestId);
    }
  };



  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Bell className="h-5 w-5" aria-hidden="true" />
            <span>Payment Notifications</span>
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Badge variant="secondary">
              {pendingRequests.length} pending
            </Badge>
            <Badge variant="outline">
              {paymentNotifications.filter(n => !n.read).length} unread
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoadingRequests ? (
          <div className="text-center py-8 text-muted-foreground">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading notifications...</p>
          </div>
        ) : requestsError ? (
          <div className="text-center py-8 text-red-500">
            <XCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Failed to load notifications</p>
            <Button 
              size="sm" 
              variant="outline" 
              className="mt-2"
              onClick={() => window.location.reload()}
            >
              Retry
            </Button>
          </div>
        ) : paymentNotifications.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No payment notifications</p>
          </div>
        ) : (
          <div className="h-96 overflow-y-auto" aria-label="Payment notifications list">
            <div className="space-y-3">
              {paymentNotifications.map((notification) => {
                return <NotificationItem 
                  key={notification.id}
                  notification={notification}
                  onNotificationClick={handleNotificationClick}
                  onClearNotification={clearNotification}
                />;
              })}
            </div>

          </div>
        )}
        
        {pendingRequests.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {pendingRequests.length} requests awaiting approval
              </div>
              <Button
                size="sm"
                onClick={() => onViewRequest?.('all')}
              >
                Review All
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}