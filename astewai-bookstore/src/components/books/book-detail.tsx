'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Share2, Heart, BookOpen, Star, Calendar, Tag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { OptimizedImage } from '@/components/ui/optimized-image'
import { BookPreview } from './book-preview'
import { BookActions } from './book-actions'
import { SocialShare } from './social-share'
import type { Book } from '@/types'
import { formatPrice, formatDate } from '@/utils/format'

interface BookDetailProps {
  book: Book
}

export function BookDetail({ book }: BookDetailProps) {
  const [showPreview, setShowPreview] = useState(false)
  const [showShare, setShowShare] = useState(false)

  const {
    id,
    title,
    author,
    description,
    cover_image_url,
    content_url,
    price,
    is_free,
    category,
    tags,
    created_at
  } = book

  return (
    <div className="max-w-6xl mx-auto">
      {/* Back Navigation */}
      <div className="mb-6">
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/books" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Books
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Book Cover and Actions */}
        <div className="lg:col-span-1">
          <Card>
            <CardContent className="p-6">
              {/* Book Cover */}
              <div className="relative aspect-[3/4] w-full mb-6 overflow-hidden rounded-lg bg-muted">
                {cover_image_url ? (
                  <OptimizedImage
                    src={cover_image_url}
                    alt={`Cover of ${title}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 33vw"
                    priority
                    fallback={
                      <div className="flex h-full items-center justify-center bg-muted">
                        <BookOpen className="h-16 w-16 text-muted-foreground" />
                      </div>
                    }
                  />
                ) : (
                  <div className="flex h-full items-center justify-center bg-muted">
                    <BookOpen className="h-16 w-16 text-muted-foreground" />
                  </div>
                )}
              </div>

              {/* Pricing */}
              <div className="mb-6 text-center">
                {is_free ? (
                  <div className="text-2xl font-bold text-green-600">Free</div>
                ) : (
                  <div className="text-3xl font-bold">{formatPrice(price)}</div>
                )}
              </div>

              {/* Action Buttons */}
              <BookActions book={book} />

              {/* Preview Button */}
              {content_url && (
                <Button
                  variant="outline"
                  className="w-full mt-3"
                  onClick={() => setShowPreview(true)}
                >
                  <BookOpen className="h-4 w-4 mr-2" />
                  Preview Book
                </Button>
              )}

              {/* Social Actions */}
              <div className="flex gap-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => setShowShare(true)}
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
                <Button variant="outline" size="sm">
                  <Heart className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Book Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Title and Author */}
          <div>
            <h1 className="text-4xl font-bold mb-2">{title}</h1>
            <p className="text-xl text-muted-foreground mb-4">by {author}</p>
            
            {/* Metadata */}
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-6">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Published {formatDate(created_at)}
              </div>
              {category && (
                <div className="flex items-center gap-1">
                  <Tag className="h-4 w-4" />
                  {category}
                </div>
              )}
            </div>

            {/* Tags */}
            {tags && tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center rounded-full bg-secondary px-3 py-1 text-sm font-medium text-secondary-foreground"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Description */}
          {description && (
            <Card>
              <CardHeader>
                <CardTitle>About This Book</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-gray max-w-none">
                  {description.split('\n').map((paragraph, index) => (
                    <p key={index} className="mb-4 last:mb-0">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Book Details */}
          <Card>
            <CardHeader>
              <CardTitle>Book Details</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <dt className="font-medium text-muted-foreground">Author</dt>
                  <dd className="mt-1">{author}</dd>
                </div>
                {category && (
                  <div>
                    <dt className="font-medium text-muted-foreground">Category</dt>
                    <dd className="mt-1">{category}</dd>
                  </div>
                )}
                <div>
                  <dt className="font-medium text-muted-foreground">Price</dt>
                  <dd className="mt-1">
                    {is_free ? (
                      <span className="text-green-600 font-semibold">Free</span>
                    ) : (
                      formatPrice(price)
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-muted-foreground">Published</dt>
                  <dd className="mt-1">{formatDate(created_at)}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          {/* Reviews Section Placeholder */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5" />
                Reviews
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Reviews will be available soon. Be the first to review this book!
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Book Preview Modal */}
      {showPreview && content_url && (
        <BookPreview
          book={book}
          isOpen={showPreview}
          onClose={() => setShowPreview(false)}
        />
      )}

      {/* Social Share Modal */}
      {showShare && (
        <SocialShare
          book={book}
          isOpen={showShare}
          onClose={() => setShowShare(false)}
        />
      )}
    </div>
  )
}