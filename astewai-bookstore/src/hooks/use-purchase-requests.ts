import { useQuery } from '@tanstack/react-query';
import type { PurchaseRequest, AdminContactInfo } from '@/types';

interface UsePurchaseRequestsOptions {
  enabled?: boolean;
}

export function usePurchaseRequests(options: UsePurchaseRequestsOptions = {}) {
  return useQuery({
    queryKey: ['purchase-requests', 'user'],
    queryFn: async (): Promise<PurchaseRequest[]> => {
      const response = await fetch('/api/purchase-requests');
      if (!response.ok) {
        throw new Error('Failed to fetch purchase requests');
      }
      const result = await response.json();
      return result.data;
    },
    enabled: options.enabled,
  });
}

export function useAdminContacts() {
  return useQuery({
    queryKey: ['admin-contacts'],
    queryFn: async (): Promise<AdminContactInfo[]> => {
      const response = await fetch('/api/contact');
      if (!response.ok) {
        throw new Error('Failed to fetch admin contacts');
      }
      const result = await response.json();
      return result.data;
    },
  });
}