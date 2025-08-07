import { describe, it, expect } from 'vitest';
import { calculatePaymentStats, getRequestPriority } from '@/lib/utils/payment-approval-utils';
import type { PurchaseRequest } from '@/types';

const mockRequest: PurchaseRequest = {
  id: 'req-1',
  user_id: 'user-1',
  item_type: 'book',
  item_id: 'book-1',
  amount: 29.99,
  status: 'pending',
  user_message: 'Please approve my purchase',
  preferred_contact_method: 'email',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  admin_notes: null,
  book: null,
  bundle: null,
};

describe('Payment Approval Utils', () => {
  it('should calculate payment stats correctly', () => {
    const requests = [
      { ...mockRequest, status: 'pending' as const },
      { ...mockRequest, id: 'req-2', status: 'approved' as const, amount: 49.99 },
    ];

    const stats = calculatePaymentStats(requests);

    expect(stats.total).toBe(2);
    expect(stats.pending).toBe(1);
    expect(stats.approved).toBe(1);
    expect(stats.pendingValue).toBe(29.99);
    expect(stats.totalValue).toBe(49.99);
  });

  it('should determine request priority correctly', () => {
    // Recent request (normal priority)
    const recentRequest = { ...mockRequest };
    const recentPriority = getRequestPriority(recentRequest);
    expect(recentPriority.level).toBe('low');

    // Old request (high priority)
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 10);
    const oldRequest = { ...mockRequest, created_at: oldDate.toISOString() };
    const oldPriority = getRequestPriority(oldRequest);
    expect(oldPriority.level).toBe('high');
  });

  it('should handle empty request array', () => {
    const stats = calculatePaymentStats([]);
    
    expect(stats.total).toBe(0);
    expect(stats.pending).toBe(0);
    expect(stats.totalValue).toBe(0);
    expect(stats.pendingValue).toBe(0);
  });
});