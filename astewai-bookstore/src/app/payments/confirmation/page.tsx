import { notFound } from 'next/navigation'
import { paymentService } from '@/lib/services/payment-service'
import { buttonVariants } from '@/components/ui/button'
import Link from 'next/link'
import type { Metadata } from 'next'

interface ConfirmationPageProps {
  searchParams: { requestId?: string }
}

export async function generateMetadata({ searchParams }: ConfirmationPageProps): Promise<Metadata> {
  return { title: 'Payment Confirmation' }
}

export default async function ConfirmationPage({ searchParams }: ConfirmationPageProps) {
  const requestId = searchParams.requestId

  if (!requestId) {
    notFound()
  }

  const result = await paymentService.getPaymentRequest(requestId)
  if (!result.success || !result.data) {
    notFound()
  }

  const pr = result.data

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Payment submitted</h1>

      <div className="space-y-4">
        <p>Thank you — we've received your payment verification.</p>

        <div className="p-4 rounded bg-muted">
          <p className="font-semibold">Request ID</p>
          <p className="text-sm break-all">{pr.id}</p>
        </div>

        <div className="p-4 rounded bg-muted">
          <p className="font-semibold">Status</p>
          <p className="text-sm">{pr.status}</p>
        </div>

        {pr.receipt_urls && pr.receipt_urls.length > 0 && (
          <div className="p-4 rounded bg-muted">
            <p className="font-semibold">Receipt</p>
            <ul className="mt-2 space-y-1">
              {pr.receipt_urls.map((u) => (
                <li key={u}><a className="text-primary underline" href={u} target="_blank" rel="noreferrer">View uploaded receipt</a></li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex space-x-2">
          <Link href="/library" className={buttonVariants()}>Go to library</Link>
          <Link href="/help" className="btn btn-outline">Get help</Link>
        </div>
      </div>
    </div>
  )
}
