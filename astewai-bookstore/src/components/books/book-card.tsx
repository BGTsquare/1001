'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { Book } from '@/types'
import { formatPrice } from '@/utils/format'

interface BookCardProps {
  book: Book
  className?: string
  titleHighlight?: React.ReactNode
  authorHighlight?: React.ReactNode
  descriptionHighlight?: React.ReactNode
  showRank?: boolean
  rank?: number
}

export function BookCard({ 
  book, 
  className,
  titleHighlight,
  authorHighlight,
  descriptionHighlight,
  showRank = false,
  rank
}: BookCardProps) {
  const {
    id,
    title,
    author,
    description,
    cover_image_url,
    price,
    is_free,
    category,
    tags
  } = book

  return (
    <Card className={`card-enhanced hover-lift group ${className}`}>
      <CardHeader className="pb-3 relative">
        <div className="image-responsive aspect-[3/4] w-full bg-gradient-warm rounded-lg overflow-hidden shadow-soft">
          {cover_image_url ? (
            <Image
              src={cover_image_url}
              alt={`Cover of ${title}`}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-110"
              sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
              priority={false}
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-warm">
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-primary text-lg font-semibold">{title.charAt(0)}</span>
                </div>
                <span className="text-muted-foreground text-mobile-sm">No cover</span>
              </div>
            </div>
          )}
          {/* Subtle overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        </div>
      </CardHeader>
      
      <CardContent className="space-mobile-tight px-4">
        <CardTitle className="line-clamp-2 text-mobile-lg sm:text-lg leading-tight mb-2">
          <Link
            href={`/books/${id}`}
            className="hover:text-primary transition-all duration-300 touch-target group-hover:text-primary"
          >
            {titleHighlight || title}
          </Link>
        </CardTitle>

        <p className="text-muted-foreground text-mobile-sm font-medium mb-3">
          by <span className="text-accent font-semibold">{authorHighlight || author}</span>
        </p>

        {description && (
          <p className="text-muted-foreground/80 text-mobile-sm line-clamp-3 leading-relaxed mb-3">
            {descriptionHighlight || description}
          </p>
        )}

        {/* Category and Tags */}
        <div className="flex flex-wrap gap-2 mb-3">
          {category && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
              {category}
            </span>
          )}
          {tags && tags.slice(0, 2).map((tag, index) => (
            <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-accent/10 text-accent">
              {tag}
            </span>
          ))}
        </div>

        {showRank && rank && (
          <div className="text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-full inline-block">
            Relevance: {Math.round(rank * 100)}%
          </div>
        )}
        
        <div className="flex flex-wrap gap-1">
          {category && (
            <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-1 text-mobile-xs font-medium text-primary">
              {category}
            </span>
          )}
          {tags?.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center rounded-full bg-secondary px-2 py-1 text-mobile-xs font-medium text-secondary-foreground"
            >
              {tag}
            </span>
          ))}
          {tags && tags.length > 2 && (
            <span className="inline-flex items-center rounded-full bg-secondary px-2 py-1 text-mobile-xs font-medium text-secondary-foreground">
              +{tags.length - 2}
            </span>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-4 px-4 bg-gradient-warm/30">
        <div className="flex items-center gap-2">
          {is_free ? (
            <div className="flex items-center gap-2">
              <span className="text-green-600 font-bold text-mobile-lg">Free</span>
              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                No Cost
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-mobile-xl font-bold text-primary">{formatPrice(price)}</span>
              <span className="text-xs text-muted-foreground line-through">
                {formatPrice(price * 1.2)}
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            asChild
            className="button-mobile w-full sm:w-auto glass-card hover-lift border-primary/20 hover:border-primary"
          >
            <Link href={`/books/${id}`}>
              View Details
            </Link>
          </Button>

          {is_free ? (
            <Button size="sm" className="button-mobile w-full sm:w-auto gradient-primary shadow-medium hover:shadow-strong">
              Add to Library
            </Button>
          ) : (
            <Button size="sm" className="button-mobile w-full sm:w-auto gradient-primary shadow-medium hover:shadow-strong">
              Buy Now
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  )
}