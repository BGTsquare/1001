import { notFound } from 'next/navigation'
import { PaymentForm } from '@/components/payment/payment-form'
import { bookService } from '@/lib/services/book-service'
import { paymentService } from '@/lib/services/payment-service'
import { MultipleStructuredData } from '@/components/seo/structured-data'
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

export default async function PaymentPage({ params }: PaymentPageProps) {
  const { id } = params
  const result = await bookService.getBookById(id)

  if (!result.success || !result.data) {
    notFound()
  }

  const book = result.data

  return (
    <div className="container mx-auto px-4 py-8">
      <MultipleStructuredData dataArray={[]} />
      <h1 className="text-2xl font-bold mb-4">Purchase {book.title}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <PaymentForm book={book} />
        </div>

        <aside>
          <div className="space-y-4">
            <div className="p-4 rounded bg-muted">
              <h3 className="font-semibold">Payment Options</h3>
              <p className="text-sm text-muted-foreground">Choose a method and follow the deep-link or instructions.</p>
              <ul className="mt-2 space-y-2">
                {(() => {
                  // Fetch active wallets and render links server-side
                })()}
                {activeWallets.length === 0 && (
                  <li>No wallet deep-links configured. Use manual transfer instructions below.</li>
                )}
                {activeWallets.map((w) => {
                  const template = w.deep_link_template || ''
                  const link = template
                    .replace('{amount}', String(book.price || ''))
                    .replace('{reference}', book.id)

                  return (
                    <li key={w.id}>
                      {template ? (
                        <a href={link} className="text-primary underline">Open {w.wallet_name}</a>
                      ) : (
                        <span className="text-sm">{w.wallet_name} (manual)</span>
                      )}
                    </li>
                  )
                })}
                <li>
                  <a href={`/payment-instructions?bookId=${book.id}`} className="text-primary underline">Manual Transfer Instructions</a>
                </li>
              </ul>
            </div>

            <div className="p-4 rounded bg-muted">
              <h3 className="font-semibold">Need help?</h3>
              <p className="text-sm text-muted-foreground">If you have issues, contact support via the Help page.</p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}

// Server-side fetch of wallets
async function getActiveWallets() {
  const result = await paymentService.getActiveWallets()
  if (!result.success || !result.data) return []
  return result.data
}

