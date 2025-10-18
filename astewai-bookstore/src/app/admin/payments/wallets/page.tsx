"use server"

import React from 'react'
import WalletsManagement from '@/components/admin/wallets-management'

export default function AdminWalletsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <WalletsManagement />
    </div>
  )
}
