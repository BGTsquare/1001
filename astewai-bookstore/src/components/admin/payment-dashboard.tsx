'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { 
  CreditCard, 
  CheckCircle, 
  XCircle, 
  Clock, 
  DollarSign, 
  TrendingUp,
  Filter,
  Search,
  Eye,
  Check,
  X
} from 'lucide-react'
import { toast } from 'sonner'
import type { 
  PaymentRequestWithDetails, 
  PaymentFilters, 
  PaymentStats,
  AdminVerificationFormData 
} from '@/lib/types/payment'

interface PaymentDashboardProps {
  className?: string
}

export function PaymentDashboard({ className }: PaymentDashboardProps) {
  const [filters, setFilters] = useState<PaymentFilters>({})
  const [selectedPayment, setSelectedPayment] = useState<PaymentRequestWithDetails | null>(null)
  const [verificationDialogOpen, setVerificationDialogOpen] = useState(false)
  const [verificationForm, setVerificationForm] = useState<AdminVerificationFormData>({
    verification_method: 'manual',
    approve: true,
    admin_notes: ''
  })

  // Fetch payment statistics
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['payment-stats'],
    queryFn: async () => {
      const response = await fetch('/api/admin/payments/stats')
      if (!response.ok) throw new Error('Failed to fetch stats')
      return response.json()
    }
  })

  // Fetch payment requests
  const { data: payments, isLoading: paymentsLoading, refetch } = useQuery({
    queryKey: ['admin-payments', filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      
      if (filters.status) params.append('status', filters.status.join(','))
      if (filters.wallet_type) params.append('wallet_type', filters.wallet_type.join(','))
      if (filters.date_range) {
        params.append('date_from', filters.date_range[0].toISOString())
        params.append('date_to', filters.date_range[1].toISOString())
      }
      if (filters.amount_range) {
        params.append('amount_min', filters.amount_range[0].toString())
        params.append('amount_max', filters.amount_range[1].toString())
      }
      if (filters.auto_matched !== undefined) {
        params.append('auto_matched', filters.auto_matched.toString())
      }
      if (filters.search_query) params.append('search', filters.search_query)

      const response = await fetch(`/api/admin/payments?${params.toString()}`)
      if (!response.ok) throw new Error('Failed to fetch payments')
      return response.json()
    }
  })

  // Admin verification mutation
  const verifyPayment = useMutation({
    mutationFn: async ({ paymentId, formData }: { paymentId: string; formData: AdminVerificationFormData }) => {
      const response = await fetch(`/api/admin/payments/${paymentId}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to verify payment')
      }

      return response.json()
    },
    onSuccess: () => {
      toast.success('Payment verification completed')
      setVerificationDialogOpen(false)
      refetch()
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to verify payment')
    }
  })

  const handleVerifyPayment = (payment: PaymentRequestWithDetails) => {
    setSelectedPayment(payment)
    setVerificationForm({
      verification_method: 'manual',
      approve: true,
      admin_notes: ''
    })
    setVerificationDialogOpen(true)
  }

  const handleSubmitVerification = () => {
    if (selectedPayment) {
      verifyPayment.mutate({
        paymentId: selectedPayment.id,
        formData: verificationForm
      })
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: 'secondary',
      payment_initiated: 'default',
      payment_verified: 'default',
      completed: 'default',
      failed: 'destructive',
      cancelled: 'outline'
    } as const

    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      payment_initiated: 'bg-blue-100 text-blue-800',
      payment_verified: 'bg-green-100 text-green-800',
      completed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800'
    }

    return (
      <Badge className={colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    )
  }

  const getWalletIcon = (walletType: string) => {
    switch (walletType) {
      case 'mobile_money':
        return '📱'
      case 'bank_app':
        return '🏦'
      case 'crypto':
        return '₿'
      default:
        return '💳'
    }
  }

  if (statsLoading || paymentsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  const paymentStats: PaymentStats = stats?.data || {
    total_requests: 0,
    pending_requests: 0,
    completed_requests: 0,
    failed_requests: 0,
    auto_matched_requests: 0,
    manual_verified_requests: 0,
    total_amount: 0,
    average_processing_time_hours: 0
  }

  const paymentList = payments?.data?.data || []

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{paymentStats.total_requests}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{paymentStats.pending_requests}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{paymentStats.completed_requests}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{paymentStats.total_amount.toFixed(2)} ETB</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div>
              <label className="text-sm font-medium">Status</label>
              <Select onValueChange={(value) => setFilters({ ...filters, status: value ? [value] : undefined })}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="payment_initiated">Payment Initiated</SelectItem>
                  <SelectItem value="payment_verified">Payment Verified</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Wallet Type</label>
              <Select onValueChange={(value) => setFilters({ ...filters, wallet_type: value ? [value] : undefined })}>
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All types</SelectItem>
                  <SelectItem value="mobile_money">Mobile Money</SelectItem>
                  <SelectItem value="bank_app">Bank App</SelectItem>
                  <SelectItem value="crypto">Crypto</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Auto Matched</label>
              <Select onValueChange={(value) => setFilters({ ...filters, auto_matched: value === 'true' ? true : value === 'false' ? false : undefined })}>
                <SelectTrigger>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All</SelectItem>
                  <SelectItem value="true">Auto Matched</SelectItem>
                  <SelectItem value="false">Manual Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="TX ID, user email..."
                  className="pl-8"
                  value={filters.search_query || ''}
                  onChange={(e) => setFilters({ ...filters, search_query: e.target.value || undefined })}
                />
              </div>
            </div>

            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={() => setFilters({})}
                className="w-full"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {paymentList.map((payment: PaymentRequestWithDetails) => (
              <div key={payment.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div>
                      <h4 className="font-medium">{payment.item_title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {payment.user_name} ({payment.user_email})
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(payment.status)}
                    <span className="font-medium">{payment.amount} ETB</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Wallet:</span>
                    <div className="flex items-center space-x-1">
                      <span>{getWalletIcon(payment.wallet_config?.wallet_type || '')}</span>
                      <span>{payment.wallet_config?.wallet_name || 'N/A'}</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">TX ID:</span>
                    <div className="font-mono text-xs">
                      {payment.manual_tx_id || payment.ocr_extracted_tx_id || 'Not provided'}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Created:</span>
                    <div>{new Date(payment.created_at).toLocaleDateString()}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Auto Match:</span>
                    <div className="flex items-center space-x-1">
                      {payment.auto_matched_at ? (
                        <>
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-green-600">
                            {(payment.auto_match_confidence || 0 * 100).toFixed(0)}%
                          </span>
                        </>
                      ) : (
                        <span className="text-muted-foreground">No</span>
                      )}
                    </div>
                  </div>
                </div>

                {payment.status === 'payment_verified' && (
                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleVerifyPayment(payment)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Review
                    </Button>
                  </div>
                )}
              </div>
            ))}

            {paymentList.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No payment requests found
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Verification Dialog */}
      <Dialog open={verificationDialogOpen} onOpenChange={setVerificationDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Verify Payment</DialogTitle>
          </DialogHeader>
          
          {selectedPayment && (
            <div className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-medium">{selectedPayment.item_title}</h4>
                <p className="text-sm text-muted-foreground">
                  {selectedPayment.user_name} - {selectedPayment.amount} ETB
                </p>
                {selectedPayment.manual_tx_id && (
                  <p className="text-sm">
                    <span className="font-medium">TX ID:</span> {selectedPayment.manual_tx_id}
                  </p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium">Verification Method</label>
                <Select 
                  value={verificationForm.verification_method}
                  onValueChange={(value: any) => setVerificationForm({ ...verificationForm, verification_method: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Manual Review</SelectItem>
                    <SelectItem value="bank_statement">Bank Statement</SelectItem>
                    <SelectItem value="sms_verification">SMS Verification</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Notes</label>
                <Textarea
                  placeholder="Add verification notes..."
                  value={verificationForm.admin_notes}
                  onChange={(e) => setVerificationForm({ ...verificationForm, admin_notes: e.target.value })}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setVerificationForm({ ...verificationForm, approve: false })
                    handleSubmitVerification()
                  }}
                  disabled={verifyPayment.isPending}
                >
                  <X className="h-4 w-4 mr-1" />
                  Reject
                </Button>
                <Button
                  onClick={() => {
                    setVerificationForm({ ...verificationForm, approve: true })
                    handleSubmitVerification()
                  }}
                  disabled={verifyPayment.isPending}
                >
                  <Check className="h-4 w-4 mr-1" />
                  Approve
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}


