'use client'

import Link from 'next/link'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BookCoverImage } from '@/components/ui/optimized-image'
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
      <CardHeader className="pb-1 p-1.5 sm:p-2.5 sm:pb-2 relative">
        <div className="image-responsive aspect-[3/4] w-full bg-gradient-warm rounded-md overflow-hidden shadow-soft">
          <BookCoverImage
            src={cover_image_url}
            title={title}
            className="rounded-md"
          />
          {/* Subtle overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        </div>
      </CardHeader>

      <CardContent className="space-mobile-tight px-1.5 sm:px-2.5 py-1">
        <CardTitle className="line-clamp-2 text-xs sm:text-sm md:text-base leading-tight mb-1">
          <Link
            href={`/books/${id}`}
            className="hover:text-primary transition-all duration-300 touch-target group-hover:text-primary"
          >
            {titleHighlight || title}
          </Link>
        </CardTitle>

        <p className="text-muted-foreground text-xs font-medium mb-1.5 sm:mb-2">
          by <span className="text-accent font-semibold">{authorHighlight || author}</span>
        </p>

        {description && (
          <p className="text-muted-foreground/80 text-xs line-clamp-1 sm:line-clamp-2 leading-relaxed mb-1.5 sm:mb-2 hidden sm:block">
            {descriptionHighlight || description}
          </p>
        )}

        {/* Category and Tags - Simplified */}
        <div className="flex flex-wrap gap-1 mb-1.5 sm:mb-2">
          {category && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
              {category}
            </span>
          )}
          {tags?.slice(0, 1).map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center rounded-full bg-secondary px-1.5 py-0.5 text-xs font-medium text-secondary-foreground"
            >
              {tag}
            </span>
          ))}
          {tags && tags.length > 1 && (
            <span className="inline-flex items-center rounded-full bg-muted px-1.5 py-0.5 text-xs font-medium text-muted-foreground">
              +{tags.length - 1}
            </span>
          )}
        </div>

        {showRank && rank && (
          <div className="text-xs text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded-full inline-block mb-1">
            #{Math.round(rank * 100)}
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex items-center justify-between gap-2 pt-1 px-1.5 sm:px-2.5 pb-1.5 sm:pb-2">
        <div className="flex items-center">
          {is_free ? (
            <span className="text-green-600 font-bold text-sm">Free</span>
          ) : (
            <span className="text-sm font-bold text-primary">{formatPrice(price)}</span>
          )}
        </div>

        <Button
          size="sm"
          asChild
          className="text-xs h-7 px-3 sm:h-8 sm:px-4"
        >
          <Link href={`/books/${id}`}>
            {is_free ? 'Read' : 'View'}
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}