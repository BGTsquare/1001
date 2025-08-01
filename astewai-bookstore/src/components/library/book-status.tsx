'use client'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

type LibraryStatus = 'owned' | 'pending' | 'completed'

interface BookStatusProps {
  status: LibraryStatus
  progress?: number
  className?: string
  size?: 'sm' | 'md'
}

export function BookStatus({ 
  status, 
  progress = 0, 
  className,
  size = 'md'
}: BookStatusProps) {
  const getStatusConfig = (status: LibraryStatus, progress: number) => {
    switch (status) {
      case 'completed':
        return {
          variant: 'success' as const,
          label: 'Completed',
          icon: '✓'
        }
      case 'pending':
        return {
          variant: 'warning' as const,
          label: 'Pending',
          icon: '⏳'
        }
      case 'owned':
        if (progress > 0 && progress < 100) {
          return {
            variant: 'info' as const,
            label: 'In Progress',
            icon: '📖'
          }
        }
        return {
          variant: 'secondary' as const,
          label: 'Owned',
          icon: '📚'
        }
      default:
        return {
          variant: 'outline' as const,
          label: 'Unknown',
          icon: '?'
        }
    }
  }

  const config = getStatusConfig(status, progress)
  const sizeClass = size === 'sm' ? 'text-xs px-2 py-0.5' : ''

  return (
    <Badge
      variant={config.variant}
      className={cn(
        'inline-flex items-center gap-1',
        sizeClass,
        className
      )}
    >
      <span className="text-xs">{config.icon}</span>
      <span>{config.label}</span>
      {status === 'owned' && progress > 0 && progress < 100 && (
        <span className="text-xs opacity-75">({progress}%)</span>
      )}
    </Badge>
  )
}