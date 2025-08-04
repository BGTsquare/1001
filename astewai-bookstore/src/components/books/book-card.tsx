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
    <Card className={`card-mobile ${className}`}>
      <CardHeader className="pb-3">
        <div className="image-responsive aspect-[3/4] w-full bg-muted">
          {cover_image_url ? (
            <Image
              src={cover_image_url}
              alt={`Cover of ${title}`}
              fill
              className="image-responsive img"
              sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
              priority={false}
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-muted">
              <span className="text-muted-foreground text-mobile-sm">No cover</span>
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-mobile-tight">
        <CardTitle className="line-clamp-2 text-mobile-lg sm:text-lg leading-tight">
          <Link 
            href={`/books/${id}`}
            className="hover:text-primary transition-colors touch-target"
          >
            {titleHighlight || title}
          </Link>
        </CardTitle>
        
        <p className="text-muted-foreground text-mobile-sm font-medium">
          by {authorHighlight || author}
        </p>
        
        {description && (
          <p className="text-muted-foreground text-mobile-sm line-clamp-3">
            {descriptionHighlight || description}
          </p>
        )}
        
        {showRank && rank && (
          <div className="text-xs text-muted-foreground">
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
      
      <CardFooter className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-3">
        <div className="flex items-center gap-2">
          {is_free ? (
            <span className="text-green-600 font-semibold text-mobile-base">Free</span>
          ) : (
            <span className="text-mobile-lg font-semibold">{formatPrice(price)}</span>
          )}
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button variant="outline" size="sm" asChild className="button-mobile w-full sm:w-auto">
            <Link href={`/books/${id}`}>
              View Details
            </Link>
          </Button>
          
          {is_free ? (
            <Button size="sm" className="button-mobile w-full sm:w-auto">
              Add to Library
            </Button>
          ) : (
            <Button size="sm" className="button-mobile w-full sm:w-auto">
              Buy Now
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  )
}