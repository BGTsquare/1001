'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, CheckCircle, DollarSign, AlertCircle } from 'lucide-react';

interface PaymentStatsCardsProps {
  stats: {
    pending: number;
    completed: number;
    totalSpent: number;
    pendingAmount: number;
  };
}

export function PaymentStatsCards({ stats }: PaymentStatsCardsProps) {
  const statCards = [
    {
      icon: Clock,
      value: stats.pending,
      label: 'Pending',
      color: 'text-orange-600'
    },
    {
      icon: CheckCircle,
      value: stats.completed,
      label: 'Completed',
      color: 'text-green-600'
    },
    {
      icon: DollarSign,
      value: `$${stats.totalSpent.toFixed(2)}`,
      label: 'Total Spent',
      color: 'text-blue-600'
    },
    {
      icon: AlertCircle,
      value: `$${stats.pendingAmount.toFixed(2)}`,
      label: 'Pending Amount',
      color: 'text-purple-600'
    }
  ];

  return (
    <div className="grid gap-4 md:grid-cols-4">
      {statCards.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index}>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Icon className={`h-4 w-4 ${stat.color}`} />
                <div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}