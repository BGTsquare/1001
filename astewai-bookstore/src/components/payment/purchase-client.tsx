"use client"

import React, { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import clsx from 'clsx'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'

type Wallet = {
  id: string
  wallet_name: string
  deep_link_template?: string | null
}

import type { Book } from '@/types'

function formatCurrency(value?: number) {
  if (!value && value !== 0) return '—'
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(value)
}

export default function PaymentClient({ book, wallets }: { book: Book; wallets: Wallet[] }) {
  return (
    <div className="space-y-6">
      <OrderSummary book={book} />
      <PaymentSelector wallets={wallets} book={book} />
      <div className="text-sm text-muted-foreground">
        By completing this purchase, you agree to our <a href="/terms" className="underline">Terms</a>.
      </div>
    </div>
  )
}

function OrderSummary({ book }: { book: Book }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
      <div className="sm:col-span-1">
        <img src={book.cover_url || '/icons/pdfjs/pdf.worker.min.js'} alt={`Cover of ${book.title}`} className="w-28 h-36 object-cover rounded shadow-sm" />
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
            const link = template
              .replace('{amount}', String(book.price ?? ''))
              .replace('{reference}', book.id)

            return (
              <label key={w.id} className="relative p-4 border rounded-lg cursor-pointer hover:shadow transition-shadow focus-within:ring-2 focus-within:ring-ring" htmlFor={`wallet-${w.id}`}>
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
        <Label className="mb-2">Or upload a receipt for manual verification</Label>
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

  return (
    <div>
      <motion.button
        onClick={handleOpen}
        className={clsx('w-full flex items-center justify-center', loading && 'opacity-70')}
        aria-label={`Open ${wallet.wallet_name} deeplink`}
        disabled={loading}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {loading ? 'Opening…' : `Open ${wallet.wallet_name}`}
      </motion.button>

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
      const fd = new FormData()
      fd.append('receipt', file)
      fd.append('bookId', bookId)

      const res = await fetch('/api/payments/submit', { method: 'POST', body: fd })
      if (!res.ok) throw new Error('Upload failed')

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
        <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Uploading…' : 'Upload receipt'}</Button>
      </div>
    </form>
  )
}
