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
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(value)
}

export default function PaymentClient({ book, wallets }: { book: Book; wallets: Wallet[] }) {
  return null
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
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <h4 className="text-sm font-semibold">Verify Your Payment</h4>
        <p className="text-xs text-muted-foreground">Upload a screenshot of your transaction confirmation (PDF, JPG, or PNG).</p>
      </div>

      <label
        htmlFor={`receipt-input-${bookId}`}
        className="mt-2 flex items-center gap-4 w-full bg-gray-50 border-2 border-dashed border-blue-200 rounded-md p-4"
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
        />
      </label>

      {message && <div className="text-sm text-muted-foreground">{message}</div>}

      <div className="flex justify-end">
        <button type="submit" disabled={isSubmitting || !file}>{isSubmitting ? 'Uploading…' : 'Upload receipt'}</button>
      </div>
    </form>
  )
}
