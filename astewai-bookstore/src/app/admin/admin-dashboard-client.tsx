'use client'

import { useEffect, useState } from 'react'
import { AdminDashboard } from '@/components/admin/admin-dashboard'
import { AdminStats } from '@/lib/services/admin-stats-service'

export function AdminDashboardClient() {
  const [stats, setStats] = useState<AdminStats | undefined>()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/admin/stats')
        
        if (!response.ok) {
          throw new Error('Failed to fetch stats')
        }

        const result = await response.json()
        setStats(result.data)
      } catch (err) {
        console.error('Error fetching admin stats:', err)
        setError(err instanceof Error ? err.message : 'Failed to load dashboard stats')
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Error Loading Dashboard</h2>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">No Data Available</h2>
          <p className="text-muted-foreground">Unable to load dashboard statistics</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      {stats && <AdminDashboard stats={stats} />}
      {/* Wallet Configurations moved to its own page in the sidebar */}
    </div>
  )
}