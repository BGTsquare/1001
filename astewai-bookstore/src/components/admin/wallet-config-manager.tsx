'use client'

import React, { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

interface WalletConfig {
  id: string
  wallet_name: string
  wallet_type: string
  deep_link_template?: string
  account_details?: any
  is_active: boolean
}

export function WalletConfigManager() {
  const [wallets, setWallets] = useState<WalletConfig[]>([])
  const [loading, setLoading] = useState(false)
  const [adding, setAdding] = useState(false)
  const [newWallet, setNewWallet] = useState({ wallet_name: '', wallet_type: 'mobile_money', deep_link_template: '', account_details: '', instructions: '', is_active: true, display_order: 0 })

  useEffect(() => {
    fetchWallets()
  }, [])

  async function fetchWallets() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/payments/wallets')
      if (!res.ok) throw new Error('Failed to load wallets')
      const json = await res.json()
      setWallets(json.data || [])
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load wallets')
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = async () => {
    try {
      setAdding(true)

      // Basic validation
      if (!newWallet.wallet_name.trim()) throw new Error('Name is required')

      let parsedAccount = null
      if (newWallet.account_details && newWallet.account_details.trim()) {
        try {
          parsedAccount = JSON.parse(newWallet.account_details)
        } catch (e) {
          throw new Error('Account details must be valid JSON')
        }
      }

      const payload = {
        wallet_name: newWallet.wallet_name,
        wallet_type: newWallet.wallet_type,
        deep_link_template: newWallet.deep_link_template || null,
        account_details: parsedAccount,
        instructions: newWallet.instructions || null,
        is_active: newWallet.is_active,
        display_order: newWallet.display_order
      }

      const res = await fetch('/api/admin/payments/wallets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!res.ok) {
        const json = await res.json()
        throw new Error(json?.error || 'Failed to create wallet')
      }

      toast.success('Created')
      setNewWallet({ wallet_name: '', wallet_type: 'mobile_money', deep_link_template: '', account_details: '', instructions: '', is_active: true, display_order: 0 })
      fetchWallets()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Create failed')
    } finally {
      setAdding(false)
    }
  }

  const handleSave = async (w: WalletConfig) => {
    try {
      const body = {
        id: w.id,
        deep_link_template: w.deep_link_template,
        account_details: w.account_details,
        wallet_name: w.wallet_name,
        is_active: w.is_active
      }

      const res = await fetch('/api/admin/payments/wallets', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      if (!res.ok) {
        const json = await res.json()
        throw new Error(json?.error || 'Failed to save')
      }

      toast.success('Saved')
      fetchWallets()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Save failed')
    }
  }

  if (loading) return <div>Loading...</div>

  return (
    <div className="space-y-4">
      {/* Add Wallet Form */}
      <Card>
        <CardHeader>
          <CardTitle>Add Wallet</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div>
              <label className="text-sm block">Name</label>
              <Input value={newWallet.wallet_name} onChange={(e) => setNewWallet(prev => ({ ...prev, wallet_name: e.target.value }))} />
            </div>
            <div>
              <label className="text-sm block">Type</label>
              <select value={newWallet.wallet_type} onChange={(e) => setNewWallet(prev => ({ ...prev, wallet_type: e.target.value }))} className="w-full border rounded px-2 py-1">
                <option value="mobile_money">Mobile Money</option>
                <option value="bank_app">Bank App</option>
                <option value="manual_bank">Manual Bank</option>
              </select>
              <p className="text-xs text-muted-foreground">Choose the type of payment method</p>
            </div>
            <div>
              <label className="text-sm block">Deep link template</label>
              <Input value={newWallet.deep_link_template} onChange={(e) => setNewWallet(prev => ({ ...prev, deep_link_template: e.target.value }))} />
            </div>
            <div>
              <label className="text-sm block">Account details (JSON)</label>
              <Textarea placeholder='{"account_number":"0123456789","account_name":"AsteWai Books"}' value={newWallet.account_details} onChange={(e) => setNewWallet(prev => ({ ...prev, account_details: e.target.value }))} />
              <p className="text-xs text-muted-foreground">Enter JSON for structured account details (bank, account number, phone, etc.). We'll validate before creating.</p>
            </div>
            <div className="flex justify-end">
              <Button onClick={handleAdd} disabled={adding}>{adding ? 'Creating...' : 'Create'}</Button>
            </div>
          </div>
        </CardContent>
      </Card>
      {wallets.map((w) => (
        <Card key={w.id}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{w.wallet_name} ({w.wallet_type})</span>
              <div className="flex items-center space-x-2">
                <label className="text-sm">Active</label>
                <input type="checkbox" checked={w.is_active} onChange={(e) => setWallets(prev => prev.map(x => x.id === w.id ? { ...x, is_active: e.target.checked } : x))} />
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div>
                <label className="text-sm block">Deep link template</label>
                <Input value={w.deep_link_template || ''} onChange={(e) => setWallets(prev => prev.map(x => x.id === w.id ? { ...x, deep_link_template: e.target.value } : x))} />
                <p className="text-xs text-muted-foreground">Use {"{amount}"} and {"{reference}"} placeholders</p>
              </div>

              <div>
                <label className="text-sm block">Account details (JSON or text)</label>
                <Textarea value={typeof w.account_details === 'string' ? w.account_details : JSON.stringify(w.account_details || {}, null, 2)} onChange={(e) => setWallets(prev => prev.map(x => x.id === w.id ? { ...x, account_details: e.target.value } : x))} />
              </div>

              <div className="flex justify-end">
                <div className="flex items-center space-x-2">
                  <Button variant="destructive" onClick={async () => {
                    const ok = confirm('Delete this wallet configuration? This action cannot be undone.')
                    if (!ok) return
                    try {
                      const res = await fetch('/api/admin/payments/wallets', {
                        method: 'DELETE',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id: w.id })
                      })
                      if (!res.ok) {
                        const json = await res.json()
                        throw new Error(json?.error || 'Delete failed')
                      }
                      toast.success('Deleted')
                      fetchWallets()
                    } catch (err) {
                      toast.error(err instanceof Error ? err.message : 'Delete failed')
                    }
                  }}>Delete</Button>
                  <Button onClick={() => handleSave(w)}>Save</Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {wallets.length === 0 && <div>No wallet configs found</div>}
    </div>
  )
}
