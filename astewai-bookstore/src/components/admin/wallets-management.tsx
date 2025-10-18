"use client"

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { Trash2, Edit, Plus } from 'lucide-react'

type Wallet = {
  id: string
  wallet_name: string
  wallet_type: string
  deep_link_template?: string | null
  account_details?: any
  is_active?: boolean
  display_order?: number
  icon_url?: string | null
}

export default function WalletsManagement() {
  const [wallets, setWallets] = useState<Wallet[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Wallet | null>(null)

  const [form, setForm] = useState<any>({
    wallet_name: '',
    wallet_type: 'mobile_money',
    deep_link_template: '',
    account_details: '{}',
    is_active: true,
    display_order: 0,
    icon_url: ''
  })

  useEffect(() => { fetchWallets() }, [])

  async function fetchWallets() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/payments/wallets')
      if (!res.ok) throw new Error('Failed to fetch')
      const json = await res.json()
      setWallets(json.data || [])
    } catch (err: any) {
      toast.error(err?.message || 'Failed to load wallets')
    } finally {
      setLoading(false)
    }
  }

  function openAdd() {
    setEditing(null)
    setForm({ wallet_name: '', wallet_type: 'mobile_money', deep_link_template: '', account_details: '{}', is_active: true, display_order: 0, icon_url: '' })
    setDialogOpen(true)
  }

  function openEdit(w: Wallet) {
    setEditing(w)
    setForm({ ...w, account_details: JSON.stringify(w.account_details || {}, null, 2) })
    setDialogOpen(true)
  }

  async function handleSave() {
    try {
      const payload: any = { ...form }
      try { payload.account_details = JSON.parse(form.account_details) } catch (e) { throw new Error('Account details JSON invalid') }

      const method = editing ? 'PUT' : 'POST'
      if (editing) payload.id = editing.id

      const res = await fetch('/api/admin/payments/wallets', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!res.ok) {
        const js = await res.json().catch(() => ({}))
        throw new Error(js.error || 'Failed to save')
      }

      toast.success('Saved')
      setDialogOpen(false)
      fetchWallets()
    } catch (err: any) {
      toast.error(err?.message || 'Save failed')
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this wallet? This action cannot be undone.')) return
    try {
      const res = await fetch('/api/admin/payments/wallets', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      })
      if (!res.ok) throw new Error('Failed to delete')
      toast.success('Deleted')
      fetchWallets()
    } catch (err: any) {
      toast.error(err?.message || 'Delete failed')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Configured Payment Methods</h2>
        <div className="flex items-center gap-2">
          <Button onClick={openAdd}><Plus className="mr-2" />Add New Wallet</Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Wallets</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 text-center">Loading…</div>
          ) : (
            <div className="space-y-2">
              {wallets.length === 0 && <div className="text-muted-foreground">No wallets configured</div>}
              {wallets.map(w => (
                <div key={w.id} className="flex items-center justify-between p-3 bg-white rounded shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="text-xl">{w.icon_url ? <img src={w.icon_url} alt="" className="h-6 w-6" /> : '💳'}</div>
                    <div>
                      <div className="font-medium">{w.wallet_name}</div>
                      <div className="text-sm text-muted-foreground">{w.wallet_type}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${w.is_active ? 'bg-green-500' : 'bg-gray-400'}`} aria-hidden />
                      <span className="text-sm text-muted-foreground">{w.is_active ? 'Active' : 'Inactive'}</span>
                    </div>
                    <Button variant="ghost" onClick={() => openEdit(w)}><Edit /></Button>
                    <Button variant="ghost" onClick={() => handleDelete(w.id)} className="text-red-600"><Trash2 /></Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Wallet' : 'Add New Wallet'}</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="text-sm font-medium">Wallet Name</label>
              <Input value={form.wallet_name} onChange={(e: any) => setForm({ ...form, wallet_name: e.target.value })} placeholder="e.g., PayPal, Binance, Bank Transfer" />
            </div>

            <div>
              <label className="text-sm font-medium">Type</label>
              <Select onValueChange={(v: any) => setForm({ ...form, wallet_type: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mobile_money">Mobile Money</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="crypto">Crypto Wallet</SelectItem>
                  <SelectItem value="e_wallet">E-Wallet</SelectItem>
                  <SelectItem value="credit_card">Credit Card</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Deep Link Template</label>
              <Input value={form.deep_link_template} onChange={(e: any) => setForm({ ...form, deep_link_template: e.target.value })} placeholder="https://payment-provider.com/pay?amount={amount}&currency=USD&recipient={account}" />
            </div>

            <div>
              <label className="text-sm font-medium">Account Details (JSON)</label>
              <Textarea value={form.account_details} onChange={(e: any) => setForm({ ...form, account_details: e.target.value })} rows={6} />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium">Active</label>
                <Switch checked={!!form.is_active} onCheckedChange={(v: any) => setForm({ ...form, is_active: v })} />
              </div>

              <div className="flex items-center gap-2">
                <Button variant="ghost" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleSave}>Save Wallet</Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
