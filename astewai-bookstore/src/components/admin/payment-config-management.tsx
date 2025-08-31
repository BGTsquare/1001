'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Save, X, DragHandleDots2Icon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from 'sonner'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

interface PaymentConfig {
  id: string
  config_type: 'bank_account' | 'mobile_money'
  provider_name: string
  account_number: string
  account_name: string
  instructions: string
  is_active: boolean
  display_order: number
  created_at: string
  updated_at: string
}

interface PaymentConfigFormData {
  config_type: 'bank_account' | 'mobile_money'
  provider_name: string
  account_number: string
  account_name: string
  instructions: string
  is_active: boolean
  display_order: number
}

const initialFormData: PaymentConfigFormData = {
  config_type: 'bank_account',
  provider_name: '',
  account_number: '',
  account_name: '',
  instructions: '',
  is_active: true,
  display_order: 0
}

export function PaymentConfigManagement() {
  const [isAddingNew, setIsAddingNew] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<PaymentConfigFormData>(initialFormData)
  const queryClient = useQueryClient()

  // Fetch payment configurations
  const { data: configs, isLoading, error } = useQuery({
    queryKey: ['admin-payment-configs'],
    queryFn: async () => {
      const response = await fetch('/api/admin/payment-config')
      if (!response.ok) {
        throw new Error('Failed to fetch payment configurations')
      }
      const result = await response.json()
      return result.data as PaymentConfig[]
    }
  })

  // Create payment configuration
  const createMutation = useMutation({
    mutationFn: async (data: PaymentConfigFormData) => {
      const response = await fetch('/api/admin/payment-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create payment configuration')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-payment-configs'] })
      setIsAddingNew(false)
      setFormData(initialFormData)
      toast.success('Payment configuration created successfully')
    },
    onError: (error) => {
      toast.error(error.message)
    }
  })

  // Update payment configuration
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<PaymentConfigFormData> }) => {
      const response = await fetch(`/api/admin/payment-config/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update payment configuration')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-payment-configs'] })
      setEditingId(null)
      setFormData(initialFormData)
      toast.success('Payment configuration updated successfully')
    },
    onError: (error) => {
      toast.error(error.message)
    }
  })

  // Delete payment configuration
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/admin/payment-config/${id}`, {
        method: 'DELETE'
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete payment configuration')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-payment-configs'] })
      toast.success('Payment configuration deleted successfully')
    },
    onError: (error) => {
      toast.error(error.message)
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: formData })
    } else {
      createMutation.mutate(formData)
    }
  }

  const handleEdit = (config: PaymentConfig) => {
    setEditingId(config.id)
    setFormData({
      config_type: config.config_type,
      provider_name: config.provider_name,
      account_number: config.account_number,
      account_name: config.account_name,
      instructions: config.instructions,
      is_active: config.is_active,
      display_order: config.display_order
    })
    setIsAddingNew(false)
  }

  const handleCancel = () => {
    setIsAddingNew(false)
    setEditingId(null)
    setFormData(initialFormData)
  }

  const handleDelete = (id: string, providerName: string) => {
    if (confirm(`Are you sure you want to delete the payment method "${providerName}"?`)) {
      deleteMutation.mutate(id)
    }
  }

  const toggleActive = (config: PaymentConfig) => {
    updateMutation.mutate({
      id: config.id,
      data: { is_active: !config.is_active }
    })
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading payment configurations...</div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Failed to load payment configurations. Please try again.
        </AlertDescription>
      </Alert>
    )
  }

  const sortedConfigs = configs?.sort((a, b) => a.display_order - b.display_order) || []

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Payment Method Configuration</CardTitle>
              <CardDescription>
                Manage bank accounts and mobile money options for manual payments
              </CardDescription>
            </div>
            <Button
              onClick={() => setIsAddingNew(true)}
              disabled={isAddingNew || editingId !== null}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Payment Method
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add/Edit Form */}
          {(isAddingNew || editingId) && (
            <Card className="border-2 border-dashed">
              <CardContent className="p-4">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="config_type">Payment Type</Label>
                      <Select
                        value={formData.config_type}
                        onValueChange={(value: 'bank_account' | 'mobile_money') =>
                          setFormData({ ...formData, config_type: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="bank_account">Bank Account</SelectItem>
                          <SelectItem value="mobile_money">Mobile Money</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="provider_name">Provider Name</Label>
                      <Input
                        id="provider_name"
                        value={formData.provider_name}
                        onChange={(e) => setFormData({ ...formData, provider_name: e.target.value })}
                        placeholder="e.g., Commercial Bank of Ethiopia, Telebirr"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="account_number">Account Number</Label>
                      <Input
                        id="account_number"
                        value={formData.account_number}
                        onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                        placeholder="Account number or phone number"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="account_name">Account Name</Label>
                      <Input
                        id="account_name"
                        value={formData.account_name}
                        onChange={(e) => setFormData({ ...formData, account_name: e.target.value })}
                        placeholder="Account holder name"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="display_order">Display Order</Label>
                      <Input
                        id="display_order"
                        type="number"
                        value={formData.display_order}
                        onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                        min="0"
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="is_active"
                        checked={formData.is_active}
                        onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                      />
                      <Label htmlFor="is_active">Active</Label>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="instructions">Payment Instructions</Label>
                    <Textarea
                      id="instructions"
                      value={formData.instructions}
                      onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                      placeholder="Detailed instructions for users on how to make payment..."
                      rows={3}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      type="submit"
                      disabled={createMutation.isPending || updateMutation.isPending}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {editingId ? 'Update' : 'Create'}
                    </Button>
                    <Button type="button" variant="outline" onClick={handleCancel}>
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Payment Methods List */}
          <div className="space-y-3">
            {sortedConfigs.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No payment methods configured. Add one to get started.
              </div>
            ) : (
              sortedConfigs.map((config) => (
                <Card key={config.id} className={!config.is_active ? 'opacity-60' : ''}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <DragHandleDots2Icon className="h-4 w-4 text-gray-400" />
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium">{config.provider_name}</h3>
                            <Badge variant={config.config_type === 'bank_account' ? 'default' : 'secondary'}>
                              {config.config_type === 'bank_account' ? 'Bank' : 'Mobile Money'}
                            </Badge>
                            {!config.is_active && <Badge variant="destructive">Inactive</Badge>}
                          </div>
                          <p className="text-sm text-gray-600">
                            {config.account_number} • {config.account_name}
                          </p>
                          {config.instructions && (
                            <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                              {config.instructions}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Switch
                          checked={config.is_active}
                          onCheckedChange={() => toggleActive(config)}
                          disabled={updateMutation.isPending}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(config)}
                          disabled={isAddingNew || editingId !== null}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(config.id, config.provider_name)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
