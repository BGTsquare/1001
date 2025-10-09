"use client"

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import type { Book } from '@/types'

interface PaymentFormProps {
  book: Book
  onSubmitted?: () => void
}

export function PaymentForm({ book, onSubmitted }: PaymentFormProps) {
  const router = useRouter()
  const [method, setMethod] = useState<'tellbirr' | 'cbe' | 'other'>('tellbirr')
  const [amount, setAmount] = useState(book.price ?? 0)
  const [file, setFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null
    setFile(f)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const formData = new FormData()
      formData.append('bookId', book.id)
      formData.append('method', method)
      formData.append('amount', String(amount))
      if (file) formData.append('receipt', file)

      const res = await fetch(`/api/payments/submit`, {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const json = await res.json()
        const message = json?.error || 'Failed to submit payment verification'
        toast.error(message)
        throw new Error(message)
      }

      const json = await res.json()
      const paymentRequestId = json?.data?.paymentRequestId || json?.data?.paymentRequest?.id

      toast.success('Payment verification submitted — an admin will verify shortly.')

      // Redirect to a lightweight confirmation page if available
      if (paymentRequestId) {
        router.push(`/payments/confirmation?requestId=${paymentRequestId}`)
      }

      onSubmitted?.()
    } catch (err) {
      console.error(err)
      alert(err instanceof Error ? err.message : 'Submission failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Amount</Label>
            <Input value={amount} onChange={(e) => setAmount(Number(e.target.value))} type="number" />
          </div>

          <div>
            <Label className="mb-2">Payment Method</Label>
            <div className="space-y-2">
              <label className="flex items-center space-x-2">
                <input type="radio" name="method" value="tellbirr" checked={method === 'tellbirr'} onChange={() => setMethod('tellbirr')} />
                <span className="ml-2">TellBirr (deep link)</span>
              </label>
              <label className="flex items-center space-x-2">
                <input type="radio" name="method" value="cbe" checked={method === 'cbe'} onChange={() => setMethod('cbe')} />
                <span className="ml-2">CBE (deep link)</span>
              </label>
              <label className="flex items-center space-x-2">
                <input type="radio" name="method" value="other" checked={method === 'other'} onChange={() => setMethod('other')} />
                <span className="ml-2">Other (manual transfer)</span>
              </label>
            </div>
          </div>

          <div>
            <Label>Upload Payment Verification</Label>
            <input type="file" accept="image/*,application/pdf" onChange={handleFileChange} />
            {file && <p className="text-sm text-muted-foreground mt-2">Selected: {file.name}</p>}
          </div>

          <div className="text-sm text-muted-foreground">
            After you submit the payment verification, an admin will verify the payment and grant access to the book. This may take up to 24 hours.
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Submitting...' : 'Submit Payment'}</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
