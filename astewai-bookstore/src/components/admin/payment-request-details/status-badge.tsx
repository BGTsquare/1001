import React from 'react';
import { Badge } from '@/components/ui/badge';
import { getStatusConfig } from '@/lib/utils/payment-request-utils';
import type { PurchaseRequest } from '@/types';

interface StatusBadgeProps {
  status: PurchaseRequest['status'];
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = getStatusConfig(status);
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className="flex items-center space-x-1">
      <Icon className={`h-3 w-3 ${config.color}`} />
      <span>{config.label}</span>
    </Badge>
  );
}