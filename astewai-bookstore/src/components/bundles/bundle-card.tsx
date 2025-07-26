'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Package, BookOpen, TrendingDown } from 'lucide-react'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { Bundle } from '@/types'
import { formatPrice } from '@/utils/format'

interface BundleCardProps {
  bundle: Bundle
  className?: string
}

export function BundleCard({ bundle, className }: BundleCardProps) {
  const {
    id,
    title,
    description,
    price,
    books = []
  } = bundle

  // Calculate total book price and savings
  const totalBookPrice = books.reduce((sum, book) => sum + book.price, 0)
  const savings = totalBookPrice - price
  const discountPercentage = totalBookPrice > 0 ? Math.round((savings / totalBookPrice) * 100) : 0

  // Get first few book covers for display
  const displayBooks = books.slice(0, 4)
  const remainingCount = Math.max(0, books.length - 4)

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        {/* Bundle Cover Display */}
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg bg-muted">
          {displayBooks.length > 0 ? (
            <div className="grid grid-cols-2 gap-1 h-full p-2">
              {displayBooks.map((book, index) => (
                <div
                  key={book.id}
                  className="relative overflow-hidden rounded bg-muted-foreground/10"
                >
                  {book.cover_image_url ? (
                    <Image
                      src={book.cover_image_url}
                      alt={`Cover of ${book.title}`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 50vw, 25vw"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <BookOpen className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                </div>
              ))}
              
              {/* Show remaining count if there are more books */}
              {remainingCount > 0 && displayBooks.length === 4 && (
                <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                  +{remainingCount}
                </div>
              )}
            </div>
          ) : (
            <div className="flex h-full items-center justify-center">
              <Package className="h-16 w-16 text-muted-foreground" />
            </div>
          )}
        </div>

        {/* Discount Badge */}
        {discountPercentage > 0 && (
          <div className="absolute top-2 left-2 bg-destructive text-destructive-foreground text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
            <TrendingDown className="h-3 w-3" />
            {discountPercentage}% OFF
          </div>
        )}
      </CardHeader>
      
      <CardContent className="space-y-3">
        <CardTitle className="line-clamp-2 text-lg leading-tight">
          <Link 
            href={`/bundles/${id}`}
            className="hover:text-primary transition-colors"
          >
            {title}
          </Link>
        </CardTitle>
        
        {description && (
          <p className="text-muted-foreground text-sm line-clamp-2">
            {description}
          </p>
        )}
        
        {/* Book Count */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Package className="h-4 w-4" />
          <span>{books.length} book{books.length !== 1 ? 's' : ''}</span>
        </div>

        {/* Pricing Information */}
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
      </CardContent>
      
      <CardFooter className="flex items-center justify-between pt-3">
        <Button variant="outline" size="sm" asChild>
          <Link href={`/bundles/${id}`}>
            View Details
          </Link>
        </Button>
        
        <Button size="sm">
          Buy Bundle
        </Button>
      </CardFooter>
    </Card>
  )
}