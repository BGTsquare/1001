"use client"

import React, { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/contexts/auth-context'

type PaymentRequest = {
  id: string
  created_at: string
  amount: number
  status: 'pending' | 'completed' | 'failed'
  books: {
    title: string | null
  } | null
  manual_payment_submissions: {
    status: 'pending' | 'approved' | 'rejected'
  }[]
}

export default function PendingPayments() {
  const { user } = useAuth()
  const [payments, setPayments] = useState<PaymentRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchPayments() {
      if (!user) {
        setLoading(false)
        return
      }

      const supabase = createClient()
      const { data, error } = await supabase
        .from('payment_requests')
        .select(`
          id,
          created_at,
          amount,
          status,
          books ( title ),
          manual_payment_submissions ( status )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching payments:', error)
        setError('Failed to load payment history.')
      } else {
        setPayments(data as PaymentRequest[])
      }
      setLoading(false)
    }

    fetchPayments()
  }, [user])

  const getPaymentStatus = (payment: PaymentRequest) => {
    if (payment.status === 'completed') {
      return <Badge variant="default">Approved</Badge>
    }
    if (payment.manual_payment_submissions.length > 0) {
      const submissionStatus = payment.manual_payment_submissions[0].status
      if (submissionStatus === 'approved') {
        return <Badge variant="default">Approved</Badge>
      }
      if (submissionStatus === 'rejected') {
        return <Badge variant="destructive">Rejected</Badge>
      }
    }
    return <Badge variant="secondary">Pending</Badge>
  }

  if (loading) return <div>Loading payment history...</div>
  if (error) return <div className="text-red-500">{error}</div>

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Payments</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Book</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.map((payment) => (
              <TableRow key={payment.id}>
                <TableCell>{new Date(payment.created_at).toLocaleDateString()}</TableCell>
                <TableCell>{payment.books?.title || 'N/A'}</TableCell>
                <TableCell>${payment.amount.toFixed(2)}</TableCell>
                <TableCell>{getPaymentStatus(payment)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
