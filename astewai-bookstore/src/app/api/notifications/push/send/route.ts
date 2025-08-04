import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import webpush from 'web-push'
import type { PushNotificationPayload } from '@/lib/types/notifications'

// Configure web-push with VAPID keys
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    'mailto:admin@astewai.com',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  )
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Get the current user (should be admin for sending notifications)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { userIds, payload }: { userIds: string[], payload: PushNotificationPayload } = body

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json(
        { error: 'User IDs are required' },
        { status: 400 }
      )
    }

    if (!payload || !payload.title || !payload.body) {
      return NextResponse.json(
        { error: 'Notification payload with title and body is required' },
        { status: 400 }
      )
    }

    // Get push subscriptions for the specified users
    const { data: subscriptions, error: subscriptionError } = await supabase
      .from('push_subscriptions')
      .select('*')
      .in('user_id', userIds)

    if (subscriptionError) {
      console.error('Failed to fetch push subscriptions:', subscriptionError)
      return NextResponse.json(
        { error: 'Failed to fetch subscriptions' },
        { status: 500 }
      )
    }

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json(
        { message: 'No push subscriptions found for specified users' },
        { status: 200 }
      )
    }

    // Send push notifications
    const results = await Promise.allSettled(
      subscriptions.map(async (subscription) => {
        try {
          const pushSubscription = {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.p256dh,
              auth: subscription.auth
            }
          }

          await webpush.sendNotification(
            pushSubscription,
            JSON.stringify(payload),
            {
              TTL: 60 * 60 * 24, // 24 hours
              urgency: 'normal'
            }
          )

          return { success: true, userId: subscription.user_id }
        } catch (error) {
          console.error(`Failed to send push notification to user ${subscription.user_id}:`, error)
          
          // If subscription is invalid, remove it from database
          if (error instanceof Error && (
            error.message.includes('410') || 
            error.message.includes('invalid') ||
            error.message.includes('expired')
          )) {
            await supabase
              .from('push_subscriptions')
              .delete()
              .eq('id', subscription.id)
          }

          return { success: false, userId: subscription.user_id, error: error.message }
        }
      })
    )

    const successful = results.filter(result => 
      result.status === 'fulfilled' && result.value.success
    ).length

    const failed = results.length - successful

    return NextResponse.json({
      success: true,
      message: `Push notifications sent: ${successful} successful, ${failed} failed`,
      results: results.map(result => 
        result.status === 'fulfilled' ? result.value : { success: false, error: result.reason }
      )
    })
  } catch (error) {
    console.error('Error sending push notifications:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}