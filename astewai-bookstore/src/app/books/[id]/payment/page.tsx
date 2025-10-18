import { notFound } from 'next/navigation'
import { bookService } from '@/lib/services/book-service'
import { paymentService } from '@/lib/services/payment-service'
import { MultipleStructuredData } from '@/components/seo/structured-data'
import type { Book } from '@/types'
import PaymentClient from './payment-client'
import type { Metadata } from 'next'

interface PaymentPageProps {
  params: { id: string }
}

export async function generateMetadata({ params }: PaymentPageProps): Promise<Metadata> {
  try {
    const id = params?.id
    if (!id) return { title: 'Payment' }
    const result = await bookService.getBookById(id)
    if (!result.success || !result.data) return { title: 'Payment' }
    const book = result.data
    return { title: `Purchase • ${book.title}` }
  } catch (e) {
    // If any fetch or service errors occur during metadata generation, return a safe title.
    return { title: 'Payment' }
  }
}

// Client component (interactive UI)
// Note: importing a client component from a server component creates a client boundary automatically.

export default async function PaymentPage({ params }: PaymentPageProps) {
  const id = params?.id

  let book: any = { id: id || 'unknown', title: 'Book', author: null, price: null }
  try {
    if (id) {
      const result = await bookService.getBookById(id)
      if (result && result.success && result.data) book = result.data
    }
  } catch (e) {
    // swallow network/service errors and fall back to a placeholder book so the page can render
    // console.error('Error fetching book:', e)
  }

  // Server-side fetch existing active wallets for this book (resilient)
  let activeWallets: any[] = []
  try {
    if (id) activeWallets = await fetchActiveWallets(id)
  } catch (e) {
    // ignore and keep empty wallets
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <MultipleStructuredData dataArray={[]} />
      <PaymentClient book={book} wallets={activeWallets} />
    </main>
  )
}

// Server-side helper to fetch wallets
async function fetchActiveWallets(bookId: string) {
  const result = typeof paymentService.getActiveWallets === 'function'
    ? await (paymentService.getActiveWallets as any)(bookId)
    : await paymentService.getActiveWallets()

  if (!result || !result.success || !result.data) return []
  return result.data
}


