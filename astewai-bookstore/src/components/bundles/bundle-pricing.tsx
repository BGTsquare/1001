import { TrendingDown } from 'lucide-react'
import { formatPrice } from '@/utils/format'

interface BundlePricingProps {
  price: number
  totalBookPrice: number
  savings: number
  discountPercentage: number
}

export function BundlePricing({ 
  price, 
  totalBookPrice, 
  savings, 
  discountPercentage 
}: BundlePricingProps) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-lg font-bold">{formatPrice(price)}</span>
        {totalBookPrice > price && (
          <span className="text-sm text-muted-foreground line-through">
            {formatPrice(totalBookPrice)}
          </span>
        )}
      </div>
      
      {savings > 0 && (
        <p className="text-sm text-green-600 font-medium">
          Save {formatPrice(savings)}
        </p>
      )}
    </div>
  )
}

export function DiscountBadge({ discountPercentage }: { discountPercentage: number }) {
  if (discountPercentage <= 0) return null
  
  return (
    <div className="absolute top-2 left-2 bg-destructive text-destructive-foreground text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
      <TrendingDown className="h-3 w-3" />
      {discountPercentage}% OFF
    </div>
  )
}