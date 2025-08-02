'use client'

import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Package, BookOpen, DollarSign } from 'lucide-react'
import type { Bundle } from '@/types'

interface BundleWithBooks extends Bundle {
  books: Array<{
    id: string
    title: string
    author: string
    price: number
  }>
}

interface BundleDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  bundle: BundleWithBooks
  onSuccess: () => void
}

export function BundleDeleteDialog({ open, onOpenChange, bundle, onSuccess }: BundleDeleteDialogProps) {
  const [confirmText, setConfirmText] = useState('')
  const [error, setError] = useState('')

  // Delete bundle mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/admin/bundles/${bundle.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete bundle')
      }

      return response.json()
    },
    onSuccess: () => {
      onSuccess()
      handleClose()
    },
    onError: (error: Error) => {
      setError(error.message)
    }
  })

  const handleClose = () => {
    if (!deleteMutation.isPending) {
      setConfirmText('')
      setError('')
      onOpenChange(false)
    }
  }

  const handleDelete = () => {
    if (confirmText !== bundle.title) {
      setError('Bundle title does not match')
      return
    }

    setError('')
    deleteMutation.mutate()
  }

  const isConfirmValid = confirmText === bundle.title

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2 text-red-600">
            <AlertTriangle className="w-5 h-5" />
            <span>Delete Bundle</span>
          </DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently delete the bundle and remove it from all systems.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Bundle Information */}
          <div className="p-4 border rounded-lg bg-muted/50">
            <div className="flex items-start space-x-3">
              <Package className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div className="flex-1 space-y-2">
                <div>
                  <div className="font-medium">{bundle.title}</div>
                  {bundle.description && (
                    <div className="text-sm text-muted-foreground">
                      {bundle.description}
                    </div>
                  )}
                </div>
                
                <div className="flex items-center space-x-4 text-sm">
                  <div className="flex items-center space-x-1">
                    <DollarSign className="w-3 h-3" />
                    <span>${bundle.price.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <BookOpen className="w-3 h-3" />
                    <span>{bundle.books?.length || 0} books</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Warning */}
          <div className="p-4 border border-red-200 rounded-lg bg-red-50">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
              <div className="text-sm">
                <div className="font-medium text-red-800 mb-1">
                  Warning: This action is irreversible
                </div>
                <ul className="text-red-700 space-y-1">
                  <li>• The bundle will be permanently deleted</li>
                  <li>• Users will lose access to this bundle</li>
                  <li>• Purchase history will be preserved but bundle will be marked as deleted</li>
                  <li>• Individual books will remain available</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Confirmation Input */}
          <div className="space-y-2">
            <label htmlFor="confirm" className="text-sm font-medium">
              Type the bundle title to confirm deletion:
            </label>
            <input
              id="confirm"
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={bundle.title}
              className="w-full px-3 py-2 border rounded-md text-sm"
              disabled={deleteMutation.isPending}
            />
            <div className="text-xs text-muted-foreground">
              Expected: <span className="font-mono">{bundle.title}</span>
            </div>
          </div>

          {error && (
            <div className="p-3 border border-red-200 rounded-lg bg-red-50">
              <div className="flex items-center space-x-2 text-red-600">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm">{error}</span>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={deleteMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={!isConfirmValid || deleteMutation.isPending}
          >
            {deleteMutation.isPending ? 'Deleting...' : 'Delete Bundle'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}