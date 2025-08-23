'use client'

import { useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Package, BookOpen } from 'lucide-react'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BundlePricing, DiscountBadge } from './bundle-pricing'
import type { Bundle } from '@/types'
import { formatPrice } from '@/utils/format'

interface BundleCardProps {
  bundle: Bundle
  className?: string
}

// Constants
const MAX_DISPLAY_BOOKS = 4
const BOOK_GRID_COLS = 2

export function BundleCard({ bundle, className }: BundleCardProps) {
  const {
    id,
    title,
    description,
    price,
    cover_image_url,
    books = []
  } = bundle

  // Memoize expensive calculations
  const { totalBookPrice, savings, discountPercentage, displayBooks, remainingCount } = useMemo(() => {
    const totalPrice = books.reduce((sum, book) => sum + book.price, 0)
    const bundleSavings = totalPrice - price
    const discount = totalPrice > 0 ? Math.round((bundleSavings / totalPrice) * 100) : 0
    const displayBooksSlice = books.slice(0, MAX_DISPLAY_BOOKS)
    const remaining = Math.max(0, books.length - MAX_DISPLAY_BOOKS)
    
    return {
      totalBookPrice: totalPrice,
      savings: bundleSavings,
      discountPercentage: discount,
      displayBooks: displayBooksSlice,
      remainingCount: remaining
    }
  }, [books, price])

  return (
    <Card className={`card-enhanced hover-lift group ${className}`}>
      <CardHeader className="pb-3 relative">
        {/* Bundle Cover Display */}
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg bg-gradient-warm shadow-soft">
          {cover_image_url ? (
            <Image
              src={cover_image_url}
              alt={`${title} bundle cover`}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-110"
              sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
              priority={false}
              onError={(e) => {
                // Fallback to placeholder on error
                e.currentTarget.style.display = 'none'
              }}
            />
          ) : displayBooks.length > 0 ? (
            <div className={`grid grid-cols-${BOOK_GRID_COLS} gap-2 h-full p-3`}>
              {displayBooks.map((book, index) => (
                <div
                  key={book.id}
                  className="relative overflow-hidden rounded-lg bg-card shadow-soft border border-border/50 transition-transform duration-300 hover:scale-105"
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
                    <div className="flex h-full items-center justify-center bg-gradient-accent">
                      <BookOpen className="h-4 w-4 text-accent-foreground" />
                    </div>
                  )}
                </div>
              ))}

              {/* Show remaining count if there are more books */}
              {remainingCount > 0 && displayBooks.length === MAX_DISPLAY_BOOKS && (
                <div className="absolute bottom-3 right-3 glass-card text-primary text-xs px-3 py-1.5 rounded-full font-semibold shadow-medium">
                  +{remainingCount} more
                </div>
              )}
            </div>
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-warm">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-primary/10 flex items-center justify-center">
                  <Package className="h-8 w-8 text-primary" />
                </div>
                <span className="text-muted-foreground text-sm">Bundle Collection</span>
              </div>
            </div>
          )}
        </div>

        <DiscountBadge discountPercentage={discountPercentage} />
      </CardHeader>
      
      <CardContent className="space-y-3">
        <CardTitle className="line-clamp-2 text-lg leading-tight">
          <Link 
            href={`/bundles/${id}`}
            className="hover:text-primary transition-colors"
            aria-label={`View details for ${title} bundle`}
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

        <BundlePricing 
          price={price}
          totalBookPrice={totalBookPrice}
          savings={savings}
          discountPercentage={discountPercentage}
        />
      </CardContent>
      
      <CardFooter className="flex items-center justify-between pt-3">
        <Button variant="outline" size="sm" asChild>
          <Link href={`/bundles/${id}`} aria-label={`View details for ${title}`}>
            View Details
          </Link>
        </Button>
        
        <Button size="sm" aria-label={`Buy ${title} bundle for ${formatPrice(price)}`}>
          Buy Bundle
        </Button>
      </CardFooter>
    </Card>
  )
}