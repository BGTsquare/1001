"use client"

import React, { useEffect, useMemo, useState } from 'react'
import clsx from 'clsx'

// Minimal local Book type for isolated check
type Book = {
  id: string
  title: string
  author?: string | null
  price?: number | null
  cover_image_url?: string | null
}

type Wallet = {
  id: string
  wallet_name: string
  deep_link_template?: string | null
}

function formatCurrency(value?: number) {
  if (!value && value !== 0) return '—'
  // Use fixed locale to avoid SSR/CSR mismatches
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
                <div style={{ height: 16 }} />
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Refunds</span>
                    <span className="text-sm">30 days</span>
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
            <span key={w.id} className="badge">{w.wallet_name}</span>
          ))}
        </div>
      </div>
    </div>
  )
}

function PaymentSelector({ wallets, book }: { wallets: Wallet[]; book: Book }) {
  const [selected, setSelected] = useState<string | null>(wallets?.[0]?.id ?? null)

  useEffect(() => {
    if (wallets && wallets.length > 0) setSelected(wallets[0].id)
  }, [wallets])

  const selectedWallet = useMemo(() => wallets?.find((w) => w.id === selected) ?? null, [wallets, selected])

  return (
    <div className="space-y-4">
      <fieldset>
        <legend className="sr-only">Choose payment method</legend>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {(wallets && wallets.length > 0) ? wallets.map((w) => {
            const template = w.deep_link_template || ''

            return (
              <label key={w.id} className="relative p-4 border rounded-lg cursor-pointer hover:shadow transition-shadow focus-within:ring-2" htmlFor={`wallet-${w.id}`}>
                <input id={`wallet-${w.id}`} name="wallet" type="radio" className="sr-only" checked={selected === w.id} onChange={() => setSelected(w.id)} />
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{w.wallet_name}</div>
                    <div className="text-xs text-muted-foreground mt-1">{template ? 'Instant deep-link' : 'Manual transfer'}</div>
                  </div>
                  <div className="ml-4 text-sm text-muted-foreground">Open</div>
                </div>

                {selected === w.id && (
                  <div className="mt-3">
                    <DeeplinkButton wallet={w} book={book} />
                  </div>
                )}
              </label>
            )
          }) : (
            <div className="p-4 border rounded-lg text-sm text-muted-foreground">No deep-links configured — you can upload payment verification instead.</div>
          )}
        </div>
      </fieldset>

      <div>
        <label className="mb-2">Or upload a receipt for manual verification</label>
        <ReceiptUploader bookId={book.id} />
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
      // In the isolated check we don't call the real API.
      // Simulate success.
    } catch (err: any) {
      console.error(err)
      setError(err?.message || 'Failed to open deep-link')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <button onClick={handleOpen} className="w-full flex items-center justify-center">{loading ? 'Opening…' : `Open ${wallet.wallet_name}`}</button>
      {error && <div role="alert" className="mt-2 text-sm text-destructive">{error}</div>}
    </div>
  )
}

function ReceiptUploader({ bookId }: { bookId: string }) {
  const [file, setFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFile(e.target.files?.[0] ?? null)
    setMessage(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) return setMessage('Please choose a file')

    setIsSubmitting(true)
    try {
      // Simulate upload
      setMessage('Receipt uploaded — admin will verify shortly.')
    } catch (err: any) {
      console.error(err)
      setMessage(err?.message || 'Upload failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <input aria-label="Upload payment receipt" type="file" accept="image/*,application/pdf" onChange={handleFile} />
      {file && <div className="text-sm">Selected: {file.name}</div>}
      {message && <div className="text-sm text-muted-foreground">{message}</div>}
      <div className="flex justify-end">
        <button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Uploading…' : 'Upload receipt'}</button>
      </div>
    </form>
  )
}
