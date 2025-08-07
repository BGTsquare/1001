'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { PurchaseRequest } from '@/types';

interface PaymentHistoryFilters {
  searchTerm: string;
  statusFilter: string;
}

interface PaymentStats {
  total: number;
  pending: number;
  approved: number;
  completed: number;
  rejected: number;
  totalSpent: number;
  pendingAmount: number;
}

export function usePaymentHistory() {
  const [filters, setFilters] = useState<PaymentHistoryFilters>({
    searchTerm: '',
    statusFilter: 'all'
  });
  
  const queryClient = useQueryClient();

  // Fetch user's payment requests
  const { data: requests = [], isLoading, error } = useQuery({
    queryKey: ['user-purchase-requests'],
    queryFn: async () => {
      const response = await fetch('/api/purchase-requests');
      if (!response.ok) {
        throw new Error('Failed to fetch payment requests');
      }
      const result = await response.json();
      return result.data as PurchaseRequest[];
    }
  });

  // Cancel request mutation
  const cancelRequestMutation = useMutation({
    mutationFn: async ({ requestId, reason }: { requestId: string; reason: string }) => {
      const response = await fetch(`/api/purchase-requests/${requestId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to cancel request');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-purchase-requests'] });
      toast.success('Payment request cancelled successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to cancel request');
    }
  });

  // Filtered requests
  const filteredRequests = useMemo(() => {
    return requests.filter(request => {
      const itemName = request.book?.title || request.bundle?.title || '';
      const matchesSearch = !filters.searchTerm || 
        itemName.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        request.id.toLowerCase().includes(filters.searchTerm.toLowerCase());
      
      const matchesStatus = filters.statusFilter === 'all' || request.status === filters.statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [requests, filters]);

  // Calculate stats
  const stats: PaymentStats = useMemo(() => ({
    total: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    approved: requests.filter(r => r.status === 'approved').length,
    completed: requests.filter(r => r.status === 'completed').length,
    rejected: requests.filter(r => r.status === 'rejected').length,
    totalSpent: requests
      .filter(r => ['approved', 'completed'].includes(r.status))
      .reduce((sum, r) => sum + r.amount, 0),
    pendingAmount: requests
      .filter(r => r.status === 'pending')
      .reduce((sum, r) => sum + r.amount, 0),
  }), [requests]);

  return {
    requests,
    filteredRequests,
    stats,
    filters,
    setFilters,
    isLoading,
    error,
    cancelRequestMutation
  };
}