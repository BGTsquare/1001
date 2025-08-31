import Head from 'next/head'
import { useRouter } from 'next/router'

interface EnhancedSEOProps {
  title: string
  description: string
  image?: string
  type?: 'website' | 'article' | 'book' | 'product'
  publishedTime?: string
  modifiedTime?: string
  author?: string
  tags?: string[]
  price?: number
  currency?: string
  availability?: 'in_stock' | 'out_of_stock' | 'preorder'
  isbn?: string
  category?: string
  noindex?: boolean
  canonical?: string
}

export function EnhancedSEO({
  title,
  description,
  image = '/og-image.png',
  type = 'website',
  publishedTime,
  modifiedTime,
  author,
  tags = [],
  price,
  currency = 'ETB',
  availability = 'in_stock',
  isbn,
  category,
  noindex = false,
  canonical
}: EnhancedSEOProps) {
  const router = useRouter()
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://astewai-bookstore.vercel.app'
  const fullUrl = canonical || `${baseUrl}${router.asPath}`
  const fullImageUrl = image.startsWith('http') ? image : `${baseUrl}${image}`

  // Generate structured data based on type
  const generateStructuredData = () => {
    const baseData = {
      '@context': 'https://schema.org',
      '@type': type === 'book' ? 'Book' : type === 'product' ? 'Product' : 'WebPage',
      name: title,
      description,
      url: fullUrl,
      image: fullImageUrl,
    }

    if (type === 'book' && isbn) {
      return {
        ...baseData,
        '@type': 'Book',
        isbn,
        author: author ? { '@type': 'Person', name: author } : undefined,
        genre: category,
        datePublished: publishedTime,
        offers: price ? {
          '@type': 'Offer',
          price,
          priceCurrency: currency,
          availability: `https://schema.org/${availability === 'in_stock' ? 'InStock' : 'OutOfStock'}`
        } : undefined
      }
    }

    if (type === 'product' && price) {
      return {
        ...baseData,
        '@type': 'Product',
        category,
        offers: {
          '@type': 'Offer',
          price,
          priceCurrency: currency,
          availability: `https://schema.org/${availability === 'in_stock' ? 'InStock' : 'OutOfStock'}`
        }
      }
    }

    if (type === 'article') {
      return {
        ...baseData,
        '@type': 'Article',
        headline: title,
        author: author ? { '@type': 'Person', name: author } : undefined,
        datePublished: publishedTime,
        dateModified: modifiedTime || publishedTime,
        keywords: tags.join(', ')
      }
    }

    return baseData
  }

  return (
    <Head>
      {/* Basic Meta Tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={tags.join(', ')} />
      {canonical && <link rel="canonical" href={canonical} />}
      
      {/* Robots */}
      {noindex && <meta name="robots" content="noindex, nofollow" />}
      
      {/* Open Graph */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={fullImageUrl} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:site_name" content="Astewai Digital Bookstore" />
      
      {/* Article specific */}
      {type === 'article' && publishedTime && (
        <meta property="article:published_time" content={publishedTime} />
      )}
      {type === 'article' && modifiedTime && (
        <meta property="article:modified_time" content={modifiedTime} />
      )}
      {type === 'article' && author && (
        <meta property="article:author" content={author} />
      )}
      {type === 'article' && tags.map(tag => (
        <meta key={tag} property="article:tag" content={tag} />
      ))}
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={fullImageUrl} />
      
      {/* Book specific */}
      {type === 'book' && isbn && <meta property="book:isbn" content={isbn} />}
      {type === 'book' && author && <meta property="book:author" content={author} />}
      
      {/* Product specific */}
      {price && (
        <>
          <meta property="product:price:amount" content={price.toString()} />
          <meta property="product:price:currency" content={currency} />
          <meta property="product:availability" content={availability} />
        </>
      )}
      
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(generateStructuredData())
        }}
      />
      
      {/* Additional Performance Hints */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link rel="dns-prefetch" href="//images.unsplash.com" />
      <link rel="dns-prefetch" href="//byxggitbwomgnxuegxgt.supabase.co" />
      
      {/* Favicon and App Icons */}
      <link rel="icon" href="/favicon.ico" />
      <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
      <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
      <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
      <link rel="manifest" href="/manifest.json" />
      <meta name="theme-color" content="#3b82f6" />
      
      {/* Mobile Optimization */}
      <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
      <meta name="format-detection" content="telephone=no" />
      
      {/* Security Headers */}
      <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
      <meta httpEquiv="X-Frame-Options" content="DENY" />
      <meta httpEquiv="X-XSS-Protection" content="1; mode=block" />
    </Head>
  )
}

// Convenience components for specific content types
export function BookSEO(props: EnhancedSEOProps & { isbn: string; author: string }) {
  return <EnhancedSEO {...props} type="book" />
}

export function ArticleSEO(props: EnhancedSEOProps & { author: string; publishedTime: string }) {
  return <EnhancedSEO {...props} type="article" />
}

export function ProductSEO(props: EnhancedSEOProps & { price: number; currency?: string }) {
  return <EnhancedSEO {...props} type="product" />
}
