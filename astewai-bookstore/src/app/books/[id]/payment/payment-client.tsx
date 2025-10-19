"use client"

import React, { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import clsx from 'clsx'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
// Use a minimal local Book type here to avoid pulling the full project type graph
// during a focused type-check.
type Book = {
  id: string
  title: string
  author?: string | null
  price?: number | null
  cover_image_url?: string | null
}

// Guarded framer-motion import; if framer-motion isn't installed yet the page still works.
let motion: any = null
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-unsafe-assignment
  motion = require('framer-motion')
} catch (e) {
  motion = null
}

type Wallet = {
  id: string
  wallet_name: string
  deep_link_template?: string | null
}

function formatCurrency(value?: number) {
  if (!value && value !== 0) return '—'
  // Use a fixed locale to ensure server and client output match during SSR hydration.
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', currencyDisplay: 'symbol', maximumFractionDigits: 2 }).format(value)
}

export default function PaymentClient({ book, wallets }: { book: Book; wallets: Wallet[] }) {
  return (
    <>
      <div className="max-w-4xl mx-auto">
        <header className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Complete purchase</h1>
          <p className="mt-2 text-sm text-muted-foreground">Secure checkout — fast, private, and reliable</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <section className="lg:col-span-2">
            <div className="overflow-visible">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg">Payment</h2>
                <Badge variant="secondary">Secure</Badge>
              </div>

              <div className="space-y-6">
                <OrderSummary book={book} />

                <PaymentSelector wallets={wallets} book={book} />

                <div className="text-sm text-muted-foreground">
                  By completing this purchase, you agree to our <a href="/terms" className="underline">Terms</a>.
                </div>
              </div>
            </div>
          </section>

          <aside>
            <div className="sticky top-6">
              <div className="mb-4">
                <h3 className="text-base font-medium">Order summary</h3>
              </div>
              <div className="bg-card p-4 rounded">
                <MiniOrderSummary book={book} wallets={wallets} />
                <Separator className="my-4" />
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Refunds</span>
                    <span className="text-sm">30 days</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Confirmation</span>
                    <span className="text-sm">Within 24 hours</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 text-xs text-muted-foreground">Payments are processed via third-party wallets configured by the admin. Your transaction details will be submitted to our admin dashboard for approval.</div>
            </div>
          </aside>
        </div>
      </div>
    </>
  )
}

function OrderSummary({ book }: { book: Book }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
      <div className="sm:col-span-1">
        <img src={(book as any).cover_image_url || '/icons/pdfjs/pdf.worker.min.js'} alt={`Cover of ${book.title}`} className="w-28 h-36 object-cover rounded shadow-sm" />
      </div>

      <div className="sm:col-span-2">
        <h2 className="text-lg font-medium">{book.title}</h2>
        <p className="text-sm text-muted-foreground mt-1">by {book.author || 'Unknown author'}</p>

        <div className="mt-4 flex items-center gap-3">
          <div className="text-2xl font-semibold">{formatCurrency(book.price)}</div>
          <Badge variant="outline">One-time</Badge>
        </div>

        <p className="mt-3 text-sm text-muted-foreground">You'll receive a receipt and access to the book after admin verification.</p>
      </div>
    </div>
  )
}

function MiniOrderSummary({ book, wallets }: { book: Book; wallets: Wallet[] }) {
  const item = book.price ?? 0
  const tax = Math.round(item * 0.0 * 100) / 100
  const discount = 0
  const total = item + tax - discount

  return (
    <div className="text-sm">
      <div className="flex justify-between"><span>Item</span><span>{formatCurrency(item)}</span></div>
      <div className="flex justify-between text-muted-foreground"><span>Taxes</span><span>{formatCurrency(tax)}</span></div>
      {discount > 0 && <div className="flex justify-between text-green-600"><span>Discount</span><span>-{formatCurrency(discount)}</span></div>}
      <div className="mt-2 flex justify-between font-semibold text-lg"><span>Total</span><span>{formatCurrency(total)}</span></div>

      <div className="mt-4">
        <div className="text-xs text-muted-foreground">Available payment methods</div>
        <div className="mt-2 flex flex-wrap gap-2">
          {(wallets || []).length === 0 && <span className="text-xs text-muted-foreground">None configured</span>}
          {(wallets || []).map((w) => (
            <Badge key={w.id}>{w.wallet_name}</Badge>
          ))}
        </div>
      </div>
    </div>
  )
}

function PaymentSelector({ wallets, book }: { wallets: Wallet[]; book: Book }) {
  const [selected, setSelected] = useState<string | null>(wallets?.[0]?.id ?? null)
  const [paymentAccounts, setPaymentAccounts] = useState<any[] | null>(null)

  useEffect(() => {
    if (wallets && wallets.length > 0) setSelected(wallets[0].id)
    // load payment accounts/config for manual methods
    ;(async () => {
      try {
        const res = await fetch('/api/payments/config')
        if (!res.ok) return
        const json = await res.json()
        // expects { data: [{ provider_name, instructions, config_type, account_number, account_details }] }
        if (json?.data && Array.isArray(json.data)) {
          setPaymentAccounts(json.data)
        }
      } catch (e) {
        // ignore
      }
    })()
  }, [wallets])

  const selectedWallet = useMemo(() => wallets?.find((w) => w.id === selected) ?? null, [wallets, selected])
  // Build a unified accounts list from paymentAccounts (API) or wallet.account_details
  const accounts = useMemo(() => {
    const fromApi = Array.isArray(paymentAccounts) ? paymentAccounts.map((acct: any) => {
      let accountNumber = acct.account_number || ''
      let accountName = acct.account_name || ''
      try {
        if ((!accountNumber || !accountName) && acct.account_details) {
          const d = typeof acct.account_details === 'string' ? JSON.parse(acct.account_details || '{}') : acct.account_details
          accountNumber = accountNumber || d?.account_number || ''
          accountName = accountName || d?.account_name || ''
        }
      } catch (e) {}
      return { provider: acct.provider_name || acct.provider || acct.providerName || 'Account', accountName, accountNumber }
    }) : []

    const fromWallets = Array.isArray(wallets) ? wallets.map((w: any) => {
      let accountNumber = ''
      let accountName = ''
      try {
        const d = typeof w.account_details === 'string' ? JSON.parse(w.account_details || '{}') : (w.account_details || {})
        accountNumber = d?.account_number || ''
        accountName = d?.account_name || ''
      } catch (e) {}
      return { provider: w.wallet_name || 'Account', accountName, accountNumber }
    }).filter(a => a.accountNumber) : []

    // prefer API-sourced accounts, but merge with wallet-derived accounts
    const combined = fromApi.length > 0 ? fromApi.concat(fromWallets) : fromWallets
    // dedupe by accountNumber
    const seen = new Set<string>()
    return combined.filter((a) => {
      if (!a.accountNumber) return false
      if (seen.has(a.accountNumber)) return false
      seen.add(a.accountNumber)
      return true
    })
  }, [paymentAccounts, wallets])

  return (
    <div className="space-y-4">
      <div>
        <Label className="mb-2">Available account numbers</Label>
        <div className="space-y-3">
          {accounts.length > 0 ? (
            accounts.map((acct, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 border rounded bg-white">
                <div>
                  <div className="font-medium">{acct.provider}{acct.accountName ? ` • ${acct.accountName}` : ''}</div>
                  <div className="text-sm text-muted-foreground">{acct.accountNumber}</div>
                </div>
                <div>
                  <button className="px-3 py-1 bg-primary text-white rounded" onClick={() => { try { navigator.clipboard.writeText(acct.accountNumber); toast.success('Account number copied') } catch (e) { toast.error('Copy failed') } }}>Copy</button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-sm text-muted-foreground">No configured accounts</div>
          )}
        </div>
      </div>

      <div>
        <Label className="mb-2">Manual payment instructions</Label>
        <div className="p-3 border rounded bg-gray-50 text-sm text-muted-foreground">
          {accounts.length > 0 ? (
            <div>You can make a manual transfer to one of the accounts above and upload the receipt below.</div>
          ) : (
            <div>You can make a manual transfer to one of our configured accounts and upload the receipt below.</div>
          )}
        </div>
        <div className="mt-4">
          <Label className="mb-2">Or upload a receipt for manual verification</Label>
          <ReceiptUploader bookId={book.id} amount={book.price ?? undefined} paymentRequestId={null} />
        </div>
      </div>
    </div>
  )
}

function validateUrl(url: string) {
  try {
    const u = new URL(url)
    return u.protocol === 'https:' || u.protocol === 'http:'
  } catch (e) {
    return false
  }
}

function DeeplinkButton({ wallet, book }: { wallet: Wallet; book: Book }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const template = wallet.deep_link_template || ''
  const deeplink = template
    .replace('{amount}', String(book.price ?? ''))
    .replace('{reference}', book.id)

  const handleOpen = async () => {
    setError(null)
    if (!template) {
      setError('No deep-link template configured for this wallet.')
      return
    }

    if (!validateUrl(deeplink)) {
      setError('Invalid or unsafe deep-link URL.')
      return
    }

    setLoading(true)

    try {
      // Record the deep link click server-side (will auth & validate)
      const res = await fetch(`/api/payments/${encodeURIComponent(book.id)}/deep-link-click`, { method: 'POST' })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error(json?.error || 'Failed to record deep-link click')
      }

      // Open the deeplink in a new tab/window, keep user on site
      window.open(deeplink, '_blank', 'noopener,noreferrer')
    } catch (err: any) {
      console.error(err)
      setError(err?.message || 'Failed to open deep-link')
    } finally {
      setLoading(false)
    }
  }

  // Motion-enhanced button if framer-motion is available
  const ButtonEl: any = motion ? motion.motion.button : 'button'

  return (
    <div>
      <ButtonEl
        onClick={handleOpen}
        className={clsx('w-full flex items-center justify-center', loading && 'opacity-70')}
        aria-label={`Open ${wallet.wallet_name} deeplink`}
        disabled={loading}
        whileHover={motion ? { scale: 1.02 } : undefined}
        whileTap={motion ? { scale: 0.98 } : undefined}
      >
        {loading ? 'Opening…' : `Open ${wallet.wallet_name}`}
      </ButtonEl>

      {error && <div role="alert" className="mt-2 text-sm text-destructive">{error}</div>}
    </div>
  )
}

function ReceiptUploader({ bookId, amount, paymentRequestId }: { bookId: string; amount?: number | null; paymentRequestId?: string | null }) {
  const [file, setFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null
    if (f) {
      if (!ALLOWED_TYPES.includes(f.type)) {
        setMessage('Invalid file type. Accepted: JPG, PNG, WEBP, PDF')
        setFile(null)
        return
      }
      if (f.size > MAX_FILE_SIZE) {
        setMessage('File too large. Maximum 10 MB allowed.')
        setFile(null)
        return
      }
    }
    setFile(f)
    setMessage(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) return setMessage('Please choose a file')
    if (amount == null) return setMessage('Missing amount — cannot submit receipt without order total')

    setIsSubmitting(true)
    setMessage('Preparing upload...')

    try {
      // 1. Get signed URL from our server
      const signedUrlRes = await fetch('/api/payments/upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: file.name }),
      })

      if (!signedUrlRes.ok) {
        throw new Error('Could not get upload URL.')
      }

      const { signedUrl, filePath, token } = await signedUrlRes.json()

      // 2. Upload file to Supabase Storage
      setMessage('Uploading receipt...')
      const uploadRes = await fetch(signedUrl, {
        method: 'PUT',
        headers: { 
          'Content-Type': file.type,
          'Authorization': `Bearer ${token}`
        },
        body: file,
      })

      if (!uploadRes.ok) {
        throw new Error('Upload failed.')
      }

      // 3. Create submission record in our database
      setMessage('Finalizing submission...')
      const submissionRes = await fetch('/api/payments/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storage_path: filePath }),
      })

      if (!submissionRes.ok) {
        throw new Error('Could not create submission record.')
      }

      setMessage('Receipt uploaded successfully! Admin will verify shortly.')
      setFile(null)
    } catch (err: any) {
      console.error(err)
      setMessage(err?.message || 'An unexpected error occurred.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <h4 className="text-sm font-semibold">Verify Your Payment</h4>
        <p className="text-xs text-muted-foreground">Upload a screenshot of your transaction confirmation (PDF, JPG, or PNG).</p>
      </div>

      <label
        htmlFor={`receipt-input-${bookId}`}
        className="mt-2 flex items-center gap-4 w-full bg-gray-50 border-2 border-dashed border-blue-200 rounded-md p-4 cursor-pointer"
      >
        <span className="inline-flex items-center justify-center bg-blue-600 text-white rounded-md px-3 py-2 shadow-sm">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1M12 12v8m0-8l3 3m-3-3-3 3M12 3v9" />
          </svg>
          <span className="ml-2 text-sm font-medium">Choose File</span>
        </span>

        <span className={clsx('text-sm text-gray-500', file ? 'text-gray-700' : 'italic') }>
          {file ? file.name : 'No file chosen'}
        </span>

        <input
          id={`receipt-input-${bookId}`}
          type="file"
          accept="image/*,application/pdf"
          className="sr-only"
          onChange={handleFile}
          aria-label="Upload payment receipt"
          disabled={isSubmitting}
        />
      </label>

      {message && <div className="text-sm text-muted-foreground">{message}</div>}

      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting || !file}>{isSubmitting ? 'Uploading…' : 'Upload receipt'}</Button>
      </div>
    </form>
  )
}
