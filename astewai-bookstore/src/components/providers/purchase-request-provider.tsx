'use client';

import React from 'react';
import { usePurchaseRequestNotifications, useAdminPurchaseRequestNotifications } from '@/lib/hooks/use-purchase-request-notifications';
import { useAuth } from '@/contexts/auth-context';

interface PurchaseRequestProviderProps {
  children: React.ReactNode;
}

export function PurchaseRequestProvider({ children }: PurchaseRequestProviderProps) {
  const { user } = useAuth();
  
  // Enable notifications for authenticated users
  usePurchaseRequestNotifications(user?.id);
  
  // Enable admin notifications if user is admin
  if (user?.role === 'admin') {
    useAdminPurchaseRequestNotifications();
  }

  return <>{children}</>;
}