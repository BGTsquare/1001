'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, Package, BookOpen, TrendingDown, Share2, Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BookCard } from '../books/book-card'
import { BundleActions } from './bundle-actions'
import type { Bundle } from '@/types'
import { formatPrice, formatDate } from '@/utils/format'

interface BundleDetailProps {
  bundle: Bundle
}

export function BundleDetail({ bundle }: BundleDetailProps) {
  const [showShare, setShowShare] = useState(false)

  const {
    id,
    title,
    description,
    price,
    books = [],
    created_at
  } = bundle

  // Calculate pricing information
  const totalBookPrice = books.reduce((sum, book) => sum + book.price, 0)
  const savings = totalBookPrice - price
  const discountPercentage = totalBookPrice > 0 ? Math.round((savings / totalBookPrice) * 100) : 0

  // Get first few book covers for hero display
  const displayBooks = books.slice(0, 6)
  const remainingCount = Math.max(0, books.length - 6)

  return (
    <div className="max-w-6xl mx-auto">
      {/* Back Navigation */}
      <div className="mb-6">
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/bundles" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Bundles
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Bundle Cover and Actions */}
        <div className="lg:col-span-1">
          <Card>
            <CardContent className="p-6">
              {/* Bundle Cover Display */}
              <div className="relative aspect-[4/3] w-full mb-6 overflow-hidden rounded-lg bg-muted">
                {displayBooks.length > 0 ? (
                  <div className="grid grid-cols-3 gap-1 h-full p-2">
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
                            sizes="(max-width: 768px) 33vw, 16vw"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center">
                            <BookOpen className="h-3 w-3 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                    ))}
                    
                    {/* Show remaining count if there are more books */}
                    {remainingCount > 0 && (
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

                {/* Discount Badge */}
                {discountPercentage > 0 && (
                  <div className="absolute top-2 left-2 bg-destructive text-destructive-foreground text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                    <TrendingDown className="h-3 w-3" />
                    {discountPercentage}% OFF
                  </div>
                )}
              </div>

              {/* Pricing */}
              <div className="mb-6 space-y-2">
                <div className="text-center">
                  <div className="text-3xl font-bold">{formatPrice(price)}</div>
                  {totalBookPrice > price && (
                    <div className="text-lg text-muted-foreground line-through">
                      {formatPrice(totalBookPrice)}
                    </div>
                  )}
                </div>
                
                {savings > 0 && (
                  <div className="text-center">
                    <p className="text-green-600 font-semibold">
                      You save {formatPrice(savings)}
                    </p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <BundleActions bundle={bundle} />

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

        {/* Bundle Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Title and Metadata */}
          <div>
            <h1 className="text-4xl font-bold mb-4">{title}</h1>
            
            {/* Bundle Stats */}
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-6">
              <div className="flex items-center gap-1">
                <Package className="h-4 w-4" />
                {books.length} book{books.length !== 1 ? 's' : ''}
              </div>
              <div>
                Created {formatDate(created_at)}
              </div>
            </div>
          </div>

          {/* Description */}
          {description && (
            <Card>
              <CardHeader>
                <CardTitle>About This Bundle</CardTitle>
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

          {/* Value Comparison */}
          <Card>
            <CardHeader>
              <CardTitle>Bundle Value</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Individual book prices:</span>
                  <span className="font-medium">{formatPrice(totalBookPrice)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Bundle price:</span>
                  <span className="font-medium">{formatPrice(price)}</span>
                </div>
                <hr />
                <div className="flex justify-between items-center text-lg">
                  <span className="font-semibold text-green-600">Your savings:</span>
                  <span className="font-bold text-green-600">
                    {formatPrice(savings)} ({discountPercentage}% off)
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Included Books */}
          <Card>
            <CardHeader>
              <CardTitle>Books Included in This Bundle</CardTitle>
            </CardHeader>
            <CardContent>
              {books.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {books.map((book) => (
                    <div key={book.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex gap-3">
                        <div className="relative w-16 h-20 flex-shrink-0 overflow-hidden rounded bg-muted">
                          {book.cover_image_url ? (
                            <Image
                              src={book.cover_image_url}
                              alt={`Cover of ${book.title}`}
                              fill
                              className="object-cover"
                              sizes="64px"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center">
                              <BookOpen className="h-6 w-6 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold line-clamp-2 mb-1">
                            <Link 
                              href={`/books/${book.id}`}
                              className="hover:text-primary transition-colors"
                            >
                              {book.title}
                            </Link>
                          </h4>
                          <p className="text-sm text-muted-foreground mb-2">
                            by {book.author}
                          </p>
                          <div className="flex items-center justify-between">
                            <span className="font-medium">
                              {book.is_free ? (
                                <span className="text-green-600">Free</span>
                              ) : (
                                formatPrice(book.price)
                              )}
                            </span>
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/books/${book.id}`}>
                                View
                              </Link>
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">
                  No books are currently included in this bundle.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}