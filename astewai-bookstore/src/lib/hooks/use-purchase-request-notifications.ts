'use client';

import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import type { PurchaseRequest } from '@/types';

export function usePurchaseRequestNotifications(userId?: string) {
  const [isConnected, setIsConnected] = useState(false);
  const queryClient = useQueryClient();
  const supabase = createClient();

  useEffect(() => {
    if (!userId) return;

    // Subscribe to purchase request changes for the user
    const channel = supabase
      .channel('purchase-requests')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'purchase_requests',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log('Purchase request change:', payload);
          
          const request = payload.new as PurchaseRequest;
          
          // Show notification based on the change
          if (payload.eventType === 'UPDATE') {
            handleStatusUpdate(request);
          } else if (payload.eventType === 'INSERT') {
            toast.success('Purchase request created successfully!');
          }

          // Invalidate queries to refresh data
          queryClient.invalidateQueries({ queryKey: ['purchase-requests'] });
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
          console.log('Connected to purchase request notifications');
        } else if (status === 'CLOSED') {
          setIsConnected(false);
          console.log('Disconnected from purchase request notifications');
        }
      });

    return () => {
      channel.unsubscribe();
      setIsConnected(false);
    };
  }, [userId, queryClient, supabase]);

  const handleStatusUpdate = (request: PurchaseRequest) => {
    const itemName = request.book?.title || request.bundle?.title || 'your item';
    
    switch (request.status) {
      case 'contacted':
        toast.info(`Admin has contacted you about "${itemName}". Check your messages!`, {
          duration: 5000,
        });
        break;
      case 'approved':
        toast.success(`Your purchase request for "${itemName}" has been approved!`, {
          duration: 5000,
        });
        break;
      case 'rejected':
        toast.error(`Your purchase request for "${itemName}" was not approved.`, {
          duration: 5000,
        });
        break;
      case 'completed':
        toast.success(`Purchase complete! "${itemName}" is now available in your library.`, {
          duration: 5000,
        });
        break;
      default:
        break;
    }
  };

  return { isConnected };
}

// Hook for admin notifications about new purchase requests
export function useAdminPurchaseRequestNotifications() {
  const [isConnected, setIsConnected] = useState(false);
  const queryClient = useQueryClient();
  const supabase = createClient();

  useEffect(() => {
    // Subscribe to new purchase requests (admin only)
    const channel = supabase
      .channel('admin-purchase-requests')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'purchase_requests',
        },
        (payload) => {
          console.log('New purchase request:', payload);
          
          const request = payload.new as PurchaseRequest;
          const itemName = request.book?.title || request.bundle?.title || 'Unknown Item';
          
          toast.info(`New purchase request for "${itemName}"`, {
            duration: 5000,
            action: {
              label: 'View',
              onClick: () => {
                // Navigate to admin purchase requests page
                window.location.href = '/admin/purchase-requests';
              },
            },
          });

          // Invalidate admin queries
          queryClient.invalidateQueries({ queryKey: ['purchase-requests', 'admin'] });
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
          console.log('Connected to admin purchase request notifications');
        } else if (status === 'CLOSED') {
          setIsConnected(false);
          console.log('Disconnected from admin purchase request notifications');
        }
      });

    return () => {
      channel.unsubscribe();
      setIsConnected(false);
    };
  }, [queryClient, supabase]);

  return { isConnected };
}