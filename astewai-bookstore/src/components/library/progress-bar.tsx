'use client'

import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

interface ProgressBarProps {
  progress: number
  className?: string
  showPercentage?: boolean
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'success' | 'warning'
}

export function ProgressBar({
  progress,
  className,
  showPercentage = true,
  size = 'md',
  variant = 'default'
}: ProgressBarProps) {
  // Clamp progress between 0 and 100
  const clampedProgress = Math.max(0, Math.min(100, progress))
  
  const sizeClasses = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4'
  }

  const variantClasses = {
    default: '',
    success: '[&>div]:bg-green-500',
    warning: '[&>div]:bg-yellow-500'
  }

  return (
    <div className={cn('space-y-1', className)}>
      <Progress
        value={clampedProgress}
        className={cn(
          sizeClasses[size],
          variantClasses[variant]
        )}
      />
      {showPercentage && (
        <div className="flex justify-between items-center text-xs text-muted-foreground">
          <span>{clampedProgress}% complete</span>
          {clampedProgress === 100 && (
            <span className="text-green-600 font-medium">Finished</span>
          )}
        </div>
      )}
    </div>
  )
}