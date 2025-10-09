'use client'

import React from 'react'
import { WalletConfigManager } from './wallet-config-manager'

export function WalletsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
  <h1 className="text-2xl font-bold">Wallet Configurations</h1>
      </div>

      {/* Render the manager directly so its internal cards align with other admin cards */}
      <div>
        <WalletConfigManager />
      </div>
    </div>
  )
}
