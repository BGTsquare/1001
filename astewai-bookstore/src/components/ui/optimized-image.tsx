'use client'

import Image from 'next/image'
import { useState, useEffect } from 'react'

interface OptimizedImageProps {
  src: string
  alt: string
  fill?: boolean
  className?: string
  sizes?: string
  priority?: boolean
  fallback?: React.ReactNode
  onError?: () => void
}

export function OptimizedImage({
  src,
  alt,
  fill = false,
  className = '',
  sizes,
  priority = false,
  fallback,
  onError
}: OptimizedImageProps) {
  const [hasError, setHasError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Reset error state when src changes
  useEffect(() => {
    setHasError(false)
    setIsLoading(true)
  }, [src])

  const handleError = () => {
    setHasError(true)
    setIsLoading(false)
    onError?.()
  }

  const handleLoad = () => {
    setIsLoading(false)
  }

  // If no src provided, show fallback immediately
  if (!src || src.trim() === '') {
    return fallback || (
      <div className={`flex items-center justify-center bg-gray-100 dark:bg-gray-800 ${className}`}>
        <div className="text-center p-4">
          <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
            <span className="text-gray-500 dark:text-gray-400">📷</span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">No image</p>
        </div>
      </div>
    )
  }

  // If there's an error, show fallback
  if (hasError) {
    return fallback || (
      <div className={`flex items-center justify-center bg-gray-100 dark:bg-gray-800 ${className}`}>
        <div className="text-center p-4">
          <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
            <span className="text-gray-500 dark:text-gray-400">📷</span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Image unavailable</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full h-full min-h-[200px]">
      {/* Loading placeholder */}
      {isLoading && (
        <div className={`absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 animate-pulse ${className}`}>
          <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
        </div>
      )}
      
      {/* Actual image */}
      <Image
        src={src}
        alt={alt}
        fill={fill}
        className={`${className} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        sizes={sizes}
        priority={priority}
        onError={handleError}
        onLoad={handleLoad}
        unoptimized={true} // Disable optimization for problematic Supabase images
      />
    </div>
  )
}

// Specialized component for book covers
export function BookCoverImage({
  src,
  title,
  className = '',
  sizes = "(max-width: 480px) 50vw, (max-width: 640px) 33vw, (max-width: 768px) 25vw, (max-width: 1024px) 20vw, 16vw"
}: {
  src?: string
  title: string
  className?: string
  sizes?: string
}) {
  const fallback = (
    <div className={`flex h-full items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 ${className}`}>
      <div className="text-center">
        <div className="w-8 h-8 sm:w-12 sm:h-12 mx-auto mb-1 sm:mb-2 rounded-full bg-primary/10 flex items-center justify-center">
          <span className="text-primary text-sm sm:text-lg font-semibold">{title.charAt(0).toUpperCase()}</span>
        </div>
        <span className="text-muted-foreground text-xs sm:text-mobile-sm">No cover</span>
      </div>
    </div>
  )

  if (!src || src.trim() === '') {
    return fallback
  }

  return (
    <OptimizedImage
      src={src}
      alt={`Cover of ${title}`}
      fill
      className={`object-cover transition-transform duration-500 group-hover:scale-110 ${className}`}
      sizes={sizes}
      fallback={fallback}
    />
  )
}
