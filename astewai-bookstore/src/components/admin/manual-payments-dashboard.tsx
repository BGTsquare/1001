'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CheckCircle, XCircle, Clock, Eye, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { formatPrice } from '@/utils/format'

interface PendingPurchase {
  purchase_id: string
  user_id: string
  user_email: string
  user_name: string
  item_type: 'book' | 'bundle'
  item_id: string
  item_title: string
  amount: number
  transaction_reference: string
  telegram_chat_id?: number
  telegram_user_id?: number
  created_at: string
  updated_at: string
}

export function ManualPaymentsDashboard() {
  const [pendingPurchases, setPendingPurchases] = useState<PendingPurchase[]>([])
  const [loading, setLoading] = useState(true)
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchPendingPurchases()
  }, [])

  const fetchPendingPurchases = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/pending-purchases')
      
      if (!response.ok) {
        throw new Error('Failed to fetch pending purchases')
      }

      const data = await response.json()
      setPendingPurchases(data.purchases || [])
    } catch (error) {
      console.error('Error fetching pending purchases:', error)
      toast.error('Failed to load pending purchases')
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (purchaseId: string) => {
    if (processingIds.has(purchaseId)) return

    try {
      setProcessingIds(prev => new Set(prev).add(purchaseId))
      
      const response = await fetch('/api/admin/approve-purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ purchaseId }),
      })

      if (!response.ok) {
        throw new Error('Failed to approve purchase')
      }

      toast.success('Purchase approved successfully!')
      
      // Remove from pending list
      setPendingPurchases(prev => 
        prev.filter(p => p.purchase_id !== purchaseId)
      )
    } catch (error) {
      console.error('Error approving purchase:', error)
      toast.error('Failed to approve purchase')
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(purchaseId)
        return newSet
      })
    }
  }

  const handleReject = async (purchaseId: string) => {
    if (processingIds.has(purchaseId)) return

    try {
      setProcessingIds(prev => new Set(prev).add(purchaseId))
      
      const response = await fetch('/api/admin/reject-purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ purchaseId }),
      })

      if (!response.ok) {
        throw new Error('Failed to reject purchase')
      }

      toast.success('Purchase rejected')
      
      // Remove from pending list
      setPendingPurchases(prev => 
        prev.filter(p => p.purchase_id !== purchaseId)
      )
    } catch (error) {
      console.error('Error rejecting purchase:', error)
      toast.error('Failed to reject purchase')
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(purchaseId)
        return newSet
      })
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending_verification':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pending Verification</Badge>
      case 'awaiting_payment':
        return <Badge variant="outline"><Clock className="w-3 h-3 mr-1" />Awaiting Payment</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Manual Payments Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-6 h-6 animate-spin mr-2" />
            Loading pending purchases...
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Manual Payments Dashboard</h2>
        <Button onClick={fetchPendingPurchases} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Clock className="w-8 h-8 text-yellow-500 mr-3" />
              <div>
                <p className="text-2xl font-bold">{pendingPurchases.length}</p>
                <p className="text-sm text-muted-foreground">Pending Verification</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <CheckCircle className="w-8 h-8 text-green-500 mr-3" />
              <div>
                <p className="text-2xl font-bold">0</p>
                <p className="text-sm text-muted-foreground">Approved Today</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <XCircle className="w-8 h-8 text-red-500 mr-3" />
              <div>
                <p className="text-2xl font-bold">0</p>
                <p className="text-sm text-muted-foreground">Rejected Today</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pending Purchases</CardTitle>
        </CardHeader>
        <CardContent>
          {pendingPurchases.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">All caught up!</h3>
              <p className="text-muted-foreground">No pending purchases to review.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingPurchases.map((purchase) => (
                <Card key={purchase.purchase_id} className="border-l-4 border-l-yellow-500">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">{purchase.item_title}</h4>
                          <Badge variant="outline">{purchase.item_type}</Badge>
                        </div>
                        
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p><strong>Customer:</strong> {purchase.user_name} ({purchase.user_email})</p>
                          <p><strong>Order ID:</strong> {purchase.transaction_reference}</p>
                          <p><strong>Amount:</strong> {formatPrice(purchase.amount)}</p>
                          <p><strong>Created:</strong> {new Date(purchase.created_at).toLocaleString()}</p>
                          {purchase.telegram_chat_id && (
                            <p><strong>Telegram:</strong> Chat ID {purchase.telegram_chat_id}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        {getStatusBadge('pending_verification')}
                        
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleApprove(purchase.purchase_id)}
                            disabled={processingIds.has(purchase.purchase_id)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Approve
                          </Button>
                          
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleReject(purchase.purchase_id)}
                            disabled={processingIds.has(purchase.purchase_id)}
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}