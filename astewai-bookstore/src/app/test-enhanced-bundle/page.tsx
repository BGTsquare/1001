'use client'

import { useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { EnhancedBundleCreateDialog } from '@/components/admin/enhanced-bundle-create-dialog'
import { Button } from '@/components/ui/button'

const queryClient = new QueryClient()

export const dynamic = 'force-dynamic';

export default function TestEnhancedBundlePage() {
  const [open, setOpen] = useState(false)

  return (
    <QueryClientProvider client={queryClient}>
      <div className="container mx-auto py-8">
        <h1 className="text-2xl font-bold mb-4">Test Enhanced Bundle Create Dialog</h1>
        <Button onClick={() => setOpen(true)}>
          Open Enhanced Bundle Dialog
        </Button>
        
        <EnhancedBundleCreateDialog
          open={open}
          onOpenChange={setOpen}
          onSuccess={() => {
            console.log('Bundle created successfully!')
            setOpen(false)
          }}
        />
      </div>
    </QueryClientProvider>
  )
}