import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

export function usePaymentRequestMutation(requestId: string, onSuccess: () => void) {
  return useMutation({
    mutationFn: async ({ status, notes }: { status: string; notes?: string }) => {
      const response = await fetch(`/api/purchase-requests/${requestId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status, adminNotes: notes }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update request status');
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success('Request status updated successfully!');
      onSuccess();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update request status');
    }
  });
}