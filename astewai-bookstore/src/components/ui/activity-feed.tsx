'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { useNotifications } from '@/contexts/notification-context'
import { formatDistanceToNow } from 'date-fns'
import { BookOpen, Trophy, Star, Package } from 'lucide-react'
import type { ActivityFeedNotification } from '@/lib/types/notifications'

interface ActivityItem {
  id: string
  type: 'book_added' | 'book_completed' | 'review_posted' | 'bundle_purchased'
  userId: string
  userDisplayName: string
  itemId?: string
  itemTitle?: string
  timestamp: string
  metadata?: Record<string, any>
}

interface ActivityFeedProps {
  className?: string
  maxItems?: number
  showHeader?: boolean
}

export function ActivityFeed({ className, maxItems = 20, showHeader = true }: ActivityFeedProps) {
  const { notifications } = useNotifications()
  const [activities, setActivities] = useState<ActivityItem[]>([])

  // Convert activity notifications to activity items
  useEffect(() => {
    const activityNotifications = notifications
      .filter(n => n.type === 'activity_feed')
      .slice(0, maxItems)
      .map(n => {
        const data = n.data as ActivityFeedNotification
        return {
          id: n.id,
          type: data.activityType,
          userId: data.userId,
          userDisplayName: data.userDisplayName,
          itemId: data.itemId,
          itemTitle: data.itemTitle,
          timestamp: n.created_at,
          metadata: data.metadata
        }
      })

    setActivities(activityNotifications)
  }, [notifications, maxItems])

  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'book_added':
        return <BookOpen className="h-4 w-4 text-blue-500" />
      case 'book_completed':
        return <Trophy className="h-4 w-4 text-green-500" />
      case 'review_posted':
        return <Star className="h-4 w-4 text-yellow-500" />
      case 'bundle_purchased':
        return <Package className="h-4 w-4 text-purple-500" />
      default:
        return <BookOpen className="h-4 w-4 text-gray-500" />
    }
  }

  const getActivityMessage = (activity: ActivityItem) => {
    switch (activity.type) {
      case 'book_added':
        return (
          <span>
            <strong>{activity.userDisplayName}</strong> added{' '}
            <em>"{activity.itemTitle}"</em> to their library
          </span>
        )
      case 'book_completed':
        return (
          <span>
            <strong>{activity.userDisplayName}</strong> completed{' '}
            <em>"{activity.itemTitle}"</em>
          </span>
        )
      case 'review_posted':
        return (
          <span>
            <strong>{activity.userDisplayName}</strong> reviewed{' '}
            <em>"{activity.itemTitle}"</em>
          </span>
        )
      case 'bundle_purchased':
        return (
          <span>
            <strong>{activity.userDisplayName}</strong> purchased a bundle
          </span>
        )
      default:
        return (
          <span>
            <strong>{activity.userDisplayName}</strong> performed an action
          </span>
        )
    }
  }

  const getActivityBadge = (type: ActivityItem['type']) => {
    switch (type) {
      case 'book_added':
        return <Badge variant="secondary">Added</Badge>
      case 'book_completed':
        return <Badge variant="default">Completed</Badge>
      case 'review_posted':
        return <Badge variant="outline">Reviewed</Badge>
      case 'bundle_purchased':
        return <Badge variant="secondary">Purchased</Badge>
      default:
        return null
    }
  }

  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  if (activities.length === 0) {
    return (
      <Card className={className}>
        {showHeader && (
          <CardHeader>
            <CardTitle className="text-lg">Community Activity</CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No recent activity to show</p>
            <p className="text-sm mt-2">
              Activity from the community will appear here
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      {showHeader && (
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Community Activity
            <Badge variant="outline" className="ml-auto">
              {activities.length}
            </Badge>
          </CardTitle>
        </CardHeader>
      )}
      <CardContent className="p-0">
        <ScrollArea className="h-96">
          <div className="p-4 space-y-4">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarImage src={`/avatars/${activity.userId}.png`} />
                  <AvatarFallback className="text-xs">
                    {getUserInitials(activity.userDisplayName)}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {getActivityIcon(activity.type)}
                    {getActivityBadge(activity.type)}
                  </div>
                  
                  <p className="text-sm text-foreground mb-1">
                    {getActivityMessage(activity)}
                  </p>
                  
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                  </p>
                  
                  {activity.metadata && activity.type === 'book_completed' && (
                    <div className="mt-2">
                      <Badge variant="outline" className="text-xs">
                        Progress: {activity.metadata.progress}%
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}