import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, Star, TrendingUp } from 'lucide-react';
import type { BundleStats } from '@/lib/repositories/bundleRepository';

interface BundleStatsCardsProps {
  stats: BundleStats;
}

export function BundleStatsCards({ stats }: BundleStatsCardsProps) {
  const statsConfig = [
    {
      title: 'Featured Bundles',
      value: stats.featured,
      description: 'Handpicked collections',
      icon: Star,
      iconColor: 'text-yellow-500',
    },
    {
      title: 'Popular Bundles',
      value: stats.popular,
      description: 'Most purchased this month',
      icon: TrendingUp,
      iconColor: 'text-green-500',
    },
    {
      title: 'Total Bundles',
      value: stats.total,
      description: 'Available collections',
      icon: Package,
      iconColor: 'text-blue-500',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
      {statsConfig.map((stat) => {
        const IconComponent = stat.icon;
        return (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <IconComponent className={`h-4 w-4 ml-auto ${stat.iconColor}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}