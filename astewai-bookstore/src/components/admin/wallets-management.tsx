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
    deep_link_template: null,
    // keep account_details as JSON text in the form but expose an account_number helper
    account_details: '{}',
    account_number: '',
    account_name: '',
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
    setForm({ wallet_name: '', wallet_type: 'mobile_money', deep_link_template: null, account_details: '{}', account_number: '', account_name: '', is_active: true, display_order: 0, icon_url: '' })
    setDialogOpen(true)
  }

  function openEdit(w: Wallet) {
    setEditing(w)
    // extract account number if available
    let accountNumber = ''
    let accountName = ''
    try {
      const details = typeof w.account_details === 'string' ? JSON.parse(w.account_details || '{}') : (w.account_details || {})
      accountNumber = details?.account_number || details?.account || ''
      accountName = details?.account_name || details?.name || ''
    } catch (e) {
      accountNumber = ''
    }

    setForm({ ...w, account_details: JSON.stringify(w.account_details || {}, null, 2), account_number: accountNumber, account_name: accountName, deep_link_template: w.deep_link_template ?? null })
    setDialogOpen(true)
  }

  async function handleSave() {
    try {
  const payload: any = { ...form }
  let parsed: any = {}
  try { parsed = JSON.parse(form.account_details) } catch (e) { throw new Error('Account details JSON invalid') }
  // if admin provided a top-level account_number or account_name, ensure they're included in account_details
  if (form.account_number) parsed = { ...parsed, account_number: form.account_number }
  if (form.account_name) parsed = { ...parsed, account_name: form.account_name }
  payload.account_details = parsed
  // clear any deep-link templates (we no longer use deeplinks)
  payload.deep_link_template = null

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
              <label className="text-sm font-medium">Account name (bank or mobile wallet)</label>
              <Input value={form.account_name} onChange={(e: any) => setForm({ ...form, account_name: e.target.value })} placeholder="e.g., Acme Bank or MTN Mobile Money" />
            </div>

            <div>
              <label className="text-sm font-medium">Account number (for manual transfers)</label>
              <Input value={form.account_number} onChange={(e: any) => setForm({ ...form, account_number: e.target.value })} placeholder="e.g., 0123456789 or IBAN" />
              <p className="text-xs text-muted-foreground">Visible to customers on the purchase confirmation page.</p>
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

      {/* Quick copyable display for active account numbers at the bottom */}
      <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Account numbers (copyable)</CardTitle>
          </CardHeader>
          <CardContent>
            {wallets.length === 0 ? (
              <div className="text-muted-foreground">No configured accounts</div>
            ) : (
              <div className="space-y-3">
                {wallets.map((w) => {
                  // try to extract account number
                  let accountNumber = ''
                  try {
                    const details = typeof w.account_details === 'string' ? JSON.parse(w.account_details || '{}') : (w.account_details || {})
                    accountNumber = details?.account_number || details?.account || ''
                  } catch (e) {
                    accountNumber = ''
                  }

                  const typeLabel = (w.wallet_type === 'mobile_money' || w.wallet_type === 'bank_transfer') ? w.wallet_type.replace('_', ' ') : w.wallet_type

                  return (
                    <div key={w.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div>
                        <div className="font-medium">{w.wallet_name}</div>
                        <div className="text-sm text-muted-foreground">{accountNumber ? `${typeLabel} · ${accountNumber}` : ''}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        {accountNumber ? (
                          <button className="px-3 py-1 bg-primary text-white rounded text-sm" onClick={() => { try { navigator.clipboard.writeText(accountNumber); toast.success('Copied') } catch (e) { toast('Copy failed') } }}>Copy</button>
                        ) : (
                          <span className="text-xs text-muted-foreground">No account</span>
                        )}
                        <Button variant="ghost" onClick={() => openEdit(w)}>Edit</Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
