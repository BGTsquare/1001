import { useQuery } from '@tanstack/react-query';
import type { AdminContactInfo } from '@/types';

export function useAdminContacts() {
  return useQuery({
    queryKey: ['admin-contacts'],
    queryFn: async () => {
      const response = await fetch('/api/contact');
      if (!response.ok) {
        throw new Error('Failed to fetch admin contacts');
      }
      const result = await response.json();
      return result.data as AdminContactInfo[];
    }
  });
}