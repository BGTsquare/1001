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
  const result = await bookService.getBookById(params.id)
  if (!result.success || !result.data) return { title: 'Payment' }
  const book = result.data
  return { title: `Purchase • ${book.title}` }
}

// Client component (interactive UI)
// Note: importing a client component from a server component creates a client boundary automatically.

export default async function PaymentPage({ params }: PaymentPageProps) {
  const { id } = params
  const result = await bookService.getBookById(id)

  if (!result.success || !result.data) {
    notFound()
  }

  const book: any = result.data

  // Server-side fetch existing active wallets for this book
  const activeWallets: any[] = await fetchActiveWallets(id)

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


