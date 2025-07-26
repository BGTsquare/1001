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
}

export function BookCard({ book, className }: BookCardProps) {
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
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="relative aspect-[3/4] w-full overflow-hidden rounded-lg bg-muted">
          {cover_image_url ? (
            <Image
              src={cover_image_url}
              alt={`Cover of ${title}`}
              fill
              className="object-cover transition-transform hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-muted">
              <span className="text-muted-foreground text-sm">No cover</span>
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-2">
        <CardTitle className="line-clamp-2 text-lg leading-tight">
          <Link 
            href={`/books/${id}`}
            className="hover:text-primary transition-colors"
          >
            {title}
          </Link>
        </CardTitle>
        
        <p className="text-muted-foreground text-sm font-medium">
          by {author}
        </p>
        
        {description && (
          <p className="text-muted-foreground text-sm line-clamp-3">
            {description}
          </p>
        )}
        
        <div className="flex flex-wrap gap-1">
          {category && (
            <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
              {category}
            </span>
          )}
          {tags?.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center rounded-full bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground"
            >
              {tag}
            </span>
          ))}
          {tags && tags.length > 2 && (
            <span className="inline-flex items-center rounded-full bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground">
              +{tags.length - 2}
            </span>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="flex items-center justify-between pt-3">
        <div className="flex items-center gap-2">
          {is_free ? (
            <span className="text-green-600 font-semibold">Free</span>
          ) : (
            <span className="text-lg font-semibold">{formatPrice(price)}</span>
          )}
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/books/${id}`}>
              View Details
            </Link>
          </Button>
          
          {is_free ? (
            <Button size="sm">
              Add to Library
            </Button>
          ) : (
            <Button size="sm">
              Buy Now
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  )
}