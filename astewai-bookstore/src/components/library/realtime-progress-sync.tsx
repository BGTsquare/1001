'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useNotifications } from '@/contexts/notification-context'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { ReadingProgressUpdate } from '@/lib/types/library'

interface RealtimeProgressSyncProps {
  bookId: string
  onProgressUpdate?: (progress: ReadingProgressUpdate) => void
}

export function RealtimeProgressSync({ bookId, onProgressUpdate }: RealtimeProgressSyncProps) {
  const { user } = useAuth()
  const { isConnected } = useNotifications()
  const [isSync, setIsSync] = useState(false)
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null)
  const supabase = createClient()

  // Sync progress to server
  const syncProgress = async (progressData: ReadingProgressUpdate) => {
    if (!user || !bookId) return

    setIsSync(true)
    try {
      const { error } = await supabase
        .from('user_library')
        .update({
          progress: progressData.progress,
          last_read_position: progressData.lastReadPosition,
          status: progressData.status,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .eq('book_id', bookId)

      if (error) {
        console.error('Failed to sync reading progress:', error)
        toast.error('Failed to sync reading progress')
        return
      }

      setLastSyncTime(new Date())
      onProgressUpdate?.(progressData)
      
      // Show success toast for significant milestones
      if (progressData.progress > 0 && progressData.progress % 25 === 0) {
        toast.success(`Progress synced: ${progressData.progress}%`)
      }
    } catch (error) {
      console.error('Error syncing progress:', error)
      toast.error('Error syncing reading progress')
    } finally {
      setIsSync(false)
    }
  }

  // Auto-sync progress periodically
  useEffect(() => {
    if (!user || !bookId || !isConnected) return

    const syncInterval = setInterval(async () => {
      // Get current progress from local storage or state
      const localProgress = localStorage.getItem(`reading-progress-${bookId}`)
      if (!localProgress) return

      try {
        const progressData: ReadingProgressUpdate = JSON.parse(localProgress)
        
        // Check if we need to sync (progress changed or it's been a while)
        const shouldSync = !lastSyncTime || 
          Date.now() - lastSyncTime.getTime() > 30000 || // 30 seconds
          progressData.progress % 5 === 0 // Every 5% progress

        if (shouldSync) {
          await syncProgress(progressData)
        }
      } catch (error) {
        console.error('Error parsing local progress data:', error)
      }
    }, 10000) // Check every 10 seconds

    return () => clearInterval(syncInterval)
  }, [user, bookId, isConnected, lastSyncTime])

  // Listen for progress updates from other devices/tabs
  useEffect(() => {
    if (!user || !bookId) return

    const channel = supabase
      .channel(`progress-sync-${bookId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'user_library',
          filter: `user_id=eq.${user.id} AND book_id=eq.${bookId}`
        },
        (payload) => {
          const updatedData = payload.new as any
          const progressUpdate: ReadingProgressUpdate = {
            progress: updatedData.progress,
            lastReadPosition: updatedData.last_read_position,
            status: updatedData.status
          }

          // Update local storage to sync with other tabs
          localStorage.setItem(`reading-progress-${bookId}`, JSON.stringify(progressUpdate))
          
          // Notify parent component
          onProgressUpdate?.(progressUpdate)
          
          // Show notification for significant changes
          if (updatedData.status === 'completed') {
            toast.success('Book completed! Progress synced across devices.')
          }
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [user, bookId, onProgressUpdate])

  // Expose sync function for manual sync
  useEffect(() => {
    // Add event listener for manual sync requests
    const handleManualSync = (event: CustomEvent<ReadingProgressUpdate>) => {
      syncProgress(event.detail)
    }

    window.addEventListener('manual-progress-sync' as any, handleManualSync)
    
    return () => {
      window.removeEventListener('manual-progress-sync' as any, handleManualSync)
    }
  }, [])

  // Sync indicator (optional visual feedback)
  if (!isConnected) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <div className="h-2 w-2 rounded-full bg-red-500" />
        <span>Offline - progress will sync when connected</span>
      </div>
    )
  }

  if (isSync) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <div className="h-2 w-2 rounded-full bg-yellow-500 animate-pulse" />
        <span>Syncing progress...</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <div className="h-2 w-2 rounded-full bg-green-500" />
      <span>
        {lastSyncTime 
          ? `Last synced ${lastSyncTime.toLocaleTimeString()}`
          : 'Ready to sync'
        }
      </span>
    </div>
  )
}

// Utility function to trigger manual sync
export function triggerManualProgressSync(progressData: ReadingProgressUpdate) {
  const event = new CustomEvent('manual-progress-sync', { detail: progressData })
  window.dispatchEvent(event)
}