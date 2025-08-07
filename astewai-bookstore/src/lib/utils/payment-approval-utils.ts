import type { PurchaseRequest } from '@/types';

export interface PaymentApprovalStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  completed: number;
  totalValue: number;
  pendingValue: number;
  approvedValue: number;
  recentRequests: number;
}

export function calculatePaymentStats(requests: PurchaseRequest[]): PaymentApprovalStats {
  const now = new Date();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  return {
    total: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    approved: requests.filter(r => r.status === 'approved').length,
    rejected: requests.filter(r => r.status === 'rejected').length,
    completed: requests.filter(r => r.status === 'completed').length,
    totalValue: requests
      .filter(r => ['approved', 'completed'].includes(r.status))
      .reduce((sum, r) => sum + r.amount, 0),
    pendingValue: requests
      .filter(r => r.status === 'pending')
      .reduce((sum, r) => sum + r.amount, 0),
    approvedValue: requests
      .filter(r => r.status === 'approved')
      .reduce((sum, r) => sum + r.amount, 0),
    recentRequests: requests.filter(r => {
      const createdAt = new Date(r.created_at);
      return createdAt > sevenDaysAgo;
    }).length
  };
}

export function getRequestPriority(request: PurchaseRequest) {
  const createdAt = new Date(request.created_at);
  const now = new Date();
  const daysDiff = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysDiff >= 7) {
    return { 
      level: 'high' as const, 
      label: 'High Priority', 
      color: 'bg-red-100 text-red-800 border-red-200',
      urgency: 'urgent'
    };
  }
  if (daysDiff >= 3) {
    return { 
      level: 'medium' as const, 
      label: 'Medium Priority', 
      color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      urgency: 'moderate'
    };
  }
  return { 
    level: 'low' as const, 
    label: 'Normal', 
    color: 'bg-green-100 text-green-800 border-green-200',
    urgency: 'normal'
  };
}

export function sortRequestsByPriority(requests: PurchaseRequest[]): PurchaseRequest[] {
  return [...requests].sort((a, b) => {
    const priorityA = getRequestPriority(a);
    const priorityB = getRequestPriority(b);
    
    // Sort by priority level (high > medium > low)
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    const priorityDiff = priorityOrder[priorityB.level] - priorityOrder[priorityA.level];
    
    if (priorityDiff !== 0) return priorityDiff;
    
    // If same priority, sort by creation date (newer first)
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
}

export function validateBulkApproval(requests: PurchaseRequest[], totalValue: number) {
  const warnings = [];
  const errors = [];

  // Check for high-value approvals
  if (totalValue > 500) {
    warnings.push({
      type: 'high_value',
      message: `High value approval: $${totalValue.toFixed(2)}`,
      severity: 'warning' as const
    });
  }

  // Check for very high-value approvals
  if (totalValue > 1000) {
    warnings.push({
      type: 'very_high_value',
      message: `Very high value approval requires additional review`,
      severity: 'error' as const
    });
  }

  // Check for large batch size
  if (requests.length > 20) {
    warnings.push({
      type: 'large_batch',
      message: `Large batch size: ${requests.length} requests`,
      severity: 'warning' as const
    });
  }

  // Check for mixed item types
  const hasBooks = requests.some(r => r.item_type === 'book');
  const hasBundles = requests.some(r => r.item_type === 'bundle');
  if (hasBooks && hasBundles) {
    warnings.push({
      type: 'mixed_types',
      message: 'Mixed item types in selection',
      severity: 'info' as const
    });
  }

  // Check for old requests
  const oldRequests = requests.filter(r => {
    const daysDiff = Math.floor((Date.now() - new Date(r.created_at).getTime()) / (1000 * 60 * 60 * 24));
    return daysDiff > 30;
  });

  if (oldRequests.length > 0) {
    warnings.push({
      type: 'old_requests',
      message: `${oldRequests.length} requests are over 30 days old`,
      severity: 'warning' as const
    });
  }

  return { warnings, errors, isValid: errors.length === 0 };
}

export function generateApprovalSummary(requests: PurchaseRequest[], action: 'approve' | 'reject') {
  const stats = calculatePaymentStats(requests);
  const bookCount = requests.filter(r => r.item_type === 'book').length;
  const bundleCount = requests.filter(r => r.item_type === 'bundle').length;
  
  return {
    action,
    count: requests.length,
    totalValue: requests.reduce((sum, r) => sum + r.amount, 0),
    bookCount,
    bundleCount,
    averageValue: requests.length > 0 ? requests.reduce((sum, r) => sum + r.amount, 0) / requests.length : 0,
    oldestRequest: requests.reduce((oldest, current) => 
      new Date(current.created_at) < new Date(oldest.created_at) ? current : oldest
    ),
    newestRequest: requests.reduce((newest, current) => 
      new Date(current.created_at) > new Date(newest.created_at) ? current : newest
    )
  };
}

export function formatApprovalMessage(summary: ReturnType<typeof generateApprovalSummary>, notes?: string) {
  const { action, count, totalValue, bookCount, bundleCount } = summary;
  
  let message = `${action === 'approve' ? 'Approved' : 'Rejected'} ${count} payment request${count > 1 ? 's' : ''}`;
  
  if (action === 'approve') {
    message += ` worth $${totalValue.toFixed(2)}`;
  }
  
  if (bookCount > 0 && bundleCount > 0) {
    message += ` (${bookCount} book${bookCount > 1 ? 's' : ''}, ${bundleCount} bundle${bundleCount > 1 ? 's' : ''})`;
  } else if (bookCount > 0) {
    message += ` for ${bookCount} book${bookCount > 1 ? 's' : ''}`;
  } else if (bundleCount > 0) {
    message += ` for ${bundleCount} bundle${bundleCount > 1 ? 's' : ''}`;
  }
  
  if (notes) {
    message += `\n\nNotes: ${notes}`;
  }
  
  return message;
}